// Import tools and datasets from workshopTools. Make sure to put in your own user name!
var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification

var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
var atlasV2_2013 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')
var atlasV2_2014 = ee.Image('users/svangordon/conference/atlas_v2/classify/2014')

var imageReduction = atlasV2_2013.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print("atlasV2 stats 2013", imageReduction)

print('sample', atlasV2_2013.int8().sample({
  scale: 30,
  // tileScale: 4
}))

var packedImage = atlasV2_2013.multiply(100).add(atlasV2_2014)
var packedHistogram = packedImage.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print('packedHistogram', packedHistogram)

var conversionCoefficient = 0.0009
var transitionCollection = ee.Dictionary(packedHistogram.get('b1'))
  .map(function(transitionValue, pixelCount) {
    var transitionArea = ee.Number(pixelCount).multiply(conversionCoefficient)
    var transitionFrom = ee.Number.parse(transitionValue).divide(100).floor()
    var transitionTo = ee.Number.parse(transitionValue).mod(100)
    var transitionFeature = ee.Feature(null, {
      'transitionFrom': transitionFrom,
      'transitionTo': transitionTo,
      'transitionAreaKm': transitionArea
    })
    return transitionFeature
  })
  .values()
transitionCollection = ee.FeatureCollection(transitionCollection)
print('transitionCollection', transitionCollection)

Export.table.toDrive({
  collection: transitionCollection,
  folder: "eeExports",
  fileFormat: "CSV",
  description: "transitionCollection2013to2014"
});

// var transitionedToAgriculture = transitionCollection.filter(ee.Filter.eq('transitionTo', 8))

// var toAgricultureChart = ui.Chart.feature.byFeature(transitionedToAgriculture, 'transitionFrom', 'transitionAreaKm')
//   .setChartType('PieChart')
// print(toAgricultureChart)

var transitionStats = ee.List.sequence(2000, 2015)
  .map(function(year) {
    var fromFilter = ee.DateRange(ee.Date.fromYMD(year, 1, 1), ee.Date.fromYMD(year, 12, 31))
    var toFilter = ee.DateRange(ee.Date.fromYMD(year, 1, 1).advance(1, 'year'), ee.Date.fromYMD(year, 12, 31).advance(1, 'year'))

    var fromImage = ee.Image(atlasV2Collection.filterDate(fromFilter).first())
    var toImage = ee.Image(atlasV2Collection.filterDate(toFilter).first())

    var transitionImage = fromImage.multiply(100).add(toImage)
    var transitionHistogram = transitionImage.reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        scale: 30,
        maxPixels: 1e13
      })
    var conversionCoefficient = 0.0009
    var transitionCollection = ee.Dictionary(transitionHistogram.get('b1'))
      .map(function(transitionValue, pixelCount) {
        var transitionArea = ee.Number(pixelCount).multiply(conversionCoefficient)
        var transitionFrom = ee.Number.parse(transitionValue).divide(100).floor()
        var transitionTo = ee.Number.parse(transitionValue).mod(100)
        var transitionFeature = ee.Feature(null, {
          'transitionFrom': transitionFrom,
          'transitionTo': transitionTo,
          'transitionAreaKm': transitionArea,
          'fromYear': year,
          'toYear': ee.Number(year).add(1)
        })
        return transitionFeature
      })
      .values()
    return transitionCollection
  }).flatten()
transitionStats = ee.FeatureCollection(transitionStats)
print('transitionStats', transitionStats)
