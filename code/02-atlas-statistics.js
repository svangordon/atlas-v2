
// Create a function to display Atlas images in EE with the proper colors
function displayClassification(classificationImage, layerName) {
  // Cast classificationImage to Image
  classificationImage = ee.Image(classificationImage)

  var atlasPalette = [
    "8400a8", // Forest / Forêt
    "8bad8b", // Savanna / Savane
    "000080", // Wetland - floodplain / Prairie marécageuse - vallée inondable
    "ffcc99", // Steppe / Steppe
    "808000", // Plantation / Plantation
    "33cccc", // Mangrove / Mangrove
    "ffff96", // Agriculture / Zone de culture
    "3366ff", // Water bodies / Plans d'eau
    "ff99cc", // Sandy area / surfaces sableuses
    "969696", // Rocky land / Terrains rocheux
    "a87000", // Bare soil / Sols dénudés
    "ff0000", // Settlements / Habitations
    "ccff66", // Irrigated agriculture / Cultures irriguées
    "a95ce6", // Gallery forest and riparian forest / Forêt galerie et formation ripicole
    "d296e6", // Degraded forest / Forêt dégradée
    "a83800", // Bowe / Bowé
    "f5a27a", // Thicket / Fourré
    "ebc961", // Agriculture in shallows and recession / Cultures des bas-fonds et de décrue
    "28734b", // Woodland / Forêt claire
    "ebdf73", // Cropland and fallow with oil palms / Cultures et jachère sous palmier à huile
    "beffa6", // Swamp forest / Forêt marécageuse
    "a6c28c", // Sahelian short grass savanna / Savane sahélienne
    "0a9696", // Herbaceous savanna / Savane herbacée
    "749373", // Shrubland / Zone arbustive
    "505050", // Open mine / Carrière
    "FFFFFF"  // Cloud / Nuage
  ]
  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
  var remappedImage = classificationImage.remap(atlasClasses, ee.List.sequence(1, 26))
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
}

// Load the classified image that we created earlier, and exported to our assets.
var atlasV2 = ee.Image('users/mvangordon/LULCmaps/Niger')

// We want a variable to represent the class band for our image (the name
// of the band that represents the LULC class). We can determine this by printing the
// the Image to the console with print(atlasV2)
var classBand = 'classification'

// We want to guard against any 'bad' values in our dataset: we want to make sure
// there's not anything in our image that shouldn't be there.
var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
atlasV2 = atlasV2.remap(atlasClasses, atlasClasses)
  .rename('classification')

// Look at our atlas classification on the map.
displayClassification(atlasV2)


/*
  Perform a reduction for a country. We are interested in getting statistics for a
  single country. First, we load a feature collection of country boundaries. then, we
  select a single country's boundaries using its name. Then, we reduce our classified
  country using the country's boundaries. That will give us data about how many times
  each class's pixel appeared in the image. Finally, we convert the information about
  pixel counts to areas by multiplying by the area of each pixel.
*/

// First, we want to get the geometry of our country.
// Load the feature collection of ECOWAS boundaries.
var countryBoundaries = ee.FeatureCollection('users/svangordon/ecowas')
// We can print a list of the country names
print('country names', countryBoundaries.aggregate_histogram('name'))

// Get boundaries for a single country
var countryGeometry = countryBoundaries.filter(ee.Filter.equals('NAME', 'Niger'))
// Add it to the map, just so that we can see it.
Map.addLayer(countryGeometry)

// Reduce the region.
var imageReduction = atlasV2.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13,
    geometry: countryGeometry
  })

// The result of our reduction is a count of how many pixels of each class appear
// in the classified image. imageReduction is of the data type Dictionary, and it has
// only one key, which is equal to the classBand.
print("atlasV2 pixel counts 2013", imageReduction)

// To convert pixel counts to areas, we first select the class band from the
// reduction result. Then we multiply the number of pixels for each class
// by the area in km^2 of a pixel.

// Get the classBand property from imageReduction, and cast it to a Dictionary.
var pixelCounts = ee.Dictionary(imageReduction.get(classBand))

// This value represents the area of each pixel in km^2.
var pixel_area = 0.0009

// Multiply the counts by the conversion coefficient. We map over the dictionary
// of class values. The new value that we return will be the new value for each
// property in the dictionary.
var classAreas = pixelCounts
  .map(function(key, value) {
    return ee.Number(value).multiply(pixel_area)
  })

// This is a dictionary containing the area, in km^2, of each land cover class.
print('classAreas', classAreas)


/*
  Display a chart

  We want to create a chart displaying our class areas. Earth Engine lets us
  create charts. We create a chart using ui.Chart, and then we display it using print.

  Here is what we will do:
  We convert our dictionary of areas into a feature, because that is a
  data type compatible with ui.Chart. Then, we will load a
*/

var chartInput = ee.Feature(null, classAreas)
print('chartInput', chartInput)
// var nameDictionaryFrench = atlasClassMetadata.nameDictionaryFrench

var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
// var chartLabels = nameDictionaryFrench.select(chartInput.propertyNames()).getInfo()

var areaChart = ui.Chart.feature.byProperty(ee.FeatureCollection(chartInput)/*, chartLabels*/)
  .setOptions({
      vAxis: {
        title: 'km^2',
        scaleType: 'log',
        minValue: 0
      },
      hAxis: {
        title: 'Class'
      }
    })
print(areaChart)



function getCollectionAreas(image_collection, pixel_area, geometry) {
  image_collection = ee.ImageCollection(image_collection)
  var areaCollection = image_collection.map(function(image) {
    var pixelCounts = image
      .rename('classification')
      .reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        geometry: geometry,
        maxPixels: 1e13,
        scale: 30
      })
      .get('classification')
    var classAreas = ee.Dictionary(pixelCounts)
      .map(function(key, value) {
        return ee.Number(value).multiply(pixel_area)
      })
    return ee.Feature(null, classAreas)
  })
  areaCollection = ee.FeatureCollection(areaCollection)
    .set('classes', ee.Feature(ee.FeatureCollection(areaCollection).first()).toDictionary().keys())
  return areaCollection
}
var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
var atlasV2Areas = getCollectionAreas(atlasV2Collection, 0.0009)
print(atlasV2Areas)



var meanForestArea = atlasV2Areas.aggregate_mean("1")
print("meanForestArea", meanForestArea)

var atlasV2Classes = atlasV2Areas.get('classes')
var meanAreaAtlasV2 = atlasV2Areas.reduceColumns(ee.Reducer.mean().forEach(atlasV2Classes), atlasV2Areas.get('classes'))
print(meanAreaAtlasV2)

chartInput = atlasV2Areas
chartLabels = nameDictionaryFrench.select(chartInput.get('classes')).getInfo()

var timeSeriesChart = ui.Chart.feature.byFeature(chartInput)
  .setChartType('LineChart')
  .setSeriesNames(chartLabels)
  .setOptions({
      vAxis: {
        title: 'km^2',
        // scaleType: 'log'
      },
      hAxis: {
        title: 'year'
      }
    })
print(timeSeriesChart)
