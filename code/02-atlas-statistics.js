

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

var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
var atlasV2 = ee.Image('users/mvangordon/LULCmaps/Niger')
atlasV2 = atlasV2.remap(atlasClasses, atlasClasses)
  .rename('classification')

displayClassification(atlasV2)

var classBand = 'classification'

/*
  Perform a reduction for a country.
*/
// Load the LSIB country boundary collection.
// var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')
var countryBoundaries = ee.FeatureCollection('users/svangordon/ecowas')
// Map.addLayer(countryBoundaries)
// print('country names', countryBoundaries.aggregate_histogram('name'))

// Get boundaries for a single country
var countryGeometry = countryBoundaries.filter(ee.Filter.equals('NAME', 'Niger'))
Map.addLayer(countryGeometry)



var imageReduction = atlasV2.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13,
    geometry: countryGeometry
  })

print("atlasV2 stats 2013", imageReduction)

var pixelCounts = ee.Dictionary(imageReduction.get(classBand))

var conversionCoefficient = 0.0009

// Multiply the counts by the conversion coefficient
var classAreas = pixelCounts
  .map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })

print('classAreas', classAreas)

/*
  Reduce a region.
*/
// Make sure to draw a custom geometry on the map!
// Get the pixel counts
var regionalAreas = atlasV2.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: countryGeometry,
    scale: 30,
    maxPixels: 1e13
  })
// Convert pixel counts to areas
regionalAreas = ee.Dictionary(regionalAreas.get(classBand))
  .map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })

print('regional areas', regionalAreas)


/*
  Display a chart
*/

var chartInput = ee.Feature(null, classAreas)
print('chartInput', chartInput)
var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
var nameDictionaryFrench = atlasClassMetadata.nameDictionaryFrench

var chartLabels = nameDictionaryFrench.select(chartInput.propertyNames()).getInfo()

var areaChart = ui.Chart.feature.byProperty(ee.FeatureCollection(chartInput), chartLabels)
  .setOptions({
      vAxis: {
        title: 'km^2',
        scaleType: 'log'
      },
      hAxis: {
        title: 'Class'
      }
    })
print(areaChart)


/*
function getCollectionAreas(imageCollection, conversionCoefficient, reductionGeometry) {
  imageCollection = ee.ImageCollection(imageCollection)
  var areaCollection = imageCollection.map(function(image) {
    var pixelCounts = image.reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        geometry: reductionGeometry,
        maxPixels: 1e13
      })
      .get('b1')
    var classAreas = ee.Dictionary(pixelCounts)
      .map(function(key, value) {
        return ee.Number(value).multiply(conversionCoefficient)
      })
    return ee.Feature(null, classAreas)
  })
  print('areaCollection', areaCollection)
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
        scaleType: 'log'
      },
      hAxis: {
        title: 'year'
      }
    })
print(timeSeriesChart)
*/
