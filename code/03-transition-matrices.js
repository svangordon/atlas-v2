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

// var arrayCat = atlasV2_2013.toArray().arrayCat(atlasV2_2014.toArray(), 1)
// print(arrayCat)
// Map.addLayer(arrayCat, {}, 'arrayCat')
// var arrayHisto = arrayCat.reduceRegion({
//     reducer: ee.Reducer.frequencyHistogram(),
//     scale: 30,
//     maxPixels: 1e13
//   })
// print('arrayHisto', arrayHisto)

var packedImage = atlasV2_2013.multiply(100).add(atlasV2_2014)
var packedHistogram = packedImage.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print('packedHistogram', packedHistogram)

var pixelCounts = ee.Dictionary(imageReduction.get('b1'))

var conversionCoefficient = 0.0009

// Multiply the counts by the conversion coefficient
var classAreas = pixelCounts
  .map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })

var atlasV2_2000 = ee.Image(atlasV2Collection.first())
print('foo', atlasV2_2000.sample({
    scale: 30,
    tileScale: 4
  }))

// Zip together lists of [startDate, endDate - 1] and [startDate + 1, endDate]
// and combine them, so that each year has the `to` and `from` values for each pixel.
var fromDateRange = ee.DateRange('2000-01-01', '2015-12-31')
var toDateRange = ee.DateRange('2001-01-01', '2016-12-31')
var fromImages = atlasV2Collection.filterDate(fromDateRange)
var toImages = atlasV2Collection.filterDate(toDateRange)

var fromAndToImages = ee.List.sequence(2000, 2015)
  .map(function(year) {
    var startDate = ee.Date.fromYMD(year, 1, 1)
    var endDate = ee.Date.fromYMD(year, 12, 31).advance(1, 'year')
    var dateRange = ee.DateRange(startDate, endDate)
    var images = atlasV2Collection.filterDate(dateRange)
    var combinedImage = images.iterate(function(currentImage, previousImage) {
      return ee.Image(previousImage).addBands(ee.Image(currentImage))
        .clip(currentImage.geometry())
    }, ee.Image())
    return ee.Image(combinedImage).select(['b1', 'b1_1'], ['from', 'to']).int8()
  })

var transitions2000To2001 = ee.Image(fromAndToImages.get(0))
  .sample({
    scale: 30,
    tileScale: 4
  })
Map.addLayer(ee.Image(fromAndToImages.get(0)).geometry())
print('transitions2000To2001', transitions2000To2001)

displayAtlasClassification(fromAndToImages.get(0))

print('fromImages', fromImages)
print('toImages', toImages)
