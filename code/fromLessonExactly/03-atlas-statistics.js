var atlasV2_2013 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')
var imageReduction = atlasV2_2013.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print("atlasV2 stats 2013", imageReduction)

// Get the `b1` (landcover) histogram
var pixelCounts = ee.Dictionary(imageReduction.get('b1'))

// Multiply the counts by the conversion coefficient
var conversionCoefficient = 0.0009
var classAreas = pixelCounts
  .map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })

print('classAreas', classAreas)

// Make sure to draw a custom geometry on the map!
// Get the pixel counts
var regionalAreas = atlasV2_2013.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: geometry,
    scale: 30,
    maxPixels: 1e13
  })
// Convert pixel counts to areas
regionalAreas = ee.Dictionary(regionalAreas.get('b1'))
  .map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })

print('regional areas', regionalAreas)

var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')
Map.addLayer(countryBoundaries)
print(countryBoundaries.aggregate_histogram('name'))

// Get boundaries for a single country
var countryGeometry = countryBoundaries.filter(ee.Filter.equals('name', 'NIGER'))
Map.addLayer(countryGeometry)

var regionalAreas = atlasV2_2013.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: countryGeometry,
    scale: 30,
    maxPixels: 1e13
  })
regionalAreas = ee.Dictionary(regionalAreas.get('b1'))
  .map(function(key, value) {
    return ee.Number(value).multiply(0.0009)
  })
print('country areas', regionalAreas)

var chartInput = ee.Feature(null, classAreas)
chartInput = ee.FeatureCollection(chartInput)
var areaChart = ui.Chart.feature.byProperty(ee.FeatureCollection(chartInput))
print(areaChart)

var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
var nameDictionaryFrench = atlasClassMetadata.nameDictionaryFrench
print('nameDictionaryFrench', nameDictionaryFrench)
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

function getCollectionAreas(imageCollection, conversionFactor, reductionGeometry) {
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
print(getCollectionAreas(atlasV2Collection, 0.0009))

var atlasV2Classes = atlasV2Areas.get('classes')
var meanAreaAtlasV2 = atlasV2Areas.reduceColumns(
  ee.Reducer.mean().forEach(atlasV2Classes),
  atlasV2Areas.get('classes')
)
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

Export.table.toDrive({
  collection: atlasV2Areas,
  folder: "eeExports",
  fileFormat: "CSV",
  description: "atlasV2Areas"
});

/*
  Optional chart labels
*/
var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
var nameDictionaryFrench = atlasClassMetadata.nameDictionaryFrench
var chartLabels = nameDictionaryFrench.select(chartInput.propertyNames())

// var chartLabels = nameDictionaryFrench.select(chartInput.propertyNames()).getInfo()
