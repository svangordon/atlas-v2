var regions = ee.FeatureCollection('users/mamanebako01/Region_NE')
var cloud_masks = require('users/fitoprincipe/geetools:cloud_masks');
print(cloud_masks)
var maskLandsat = cloud_masks.landsatSR()

var Maradi = regions.filter(ee.Filter.eq('region', 'Maradi'))
Map.addLayer(Maradi)
print(Maradi)

Map.centerObject(Maradi, 9)

var landsat7 = imageCollection
  .filterBounds(Maradi)
  .filterDate('2000-01-01', '2017-01-01')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .map(maskLandsat)
  .map(function(image) {
    var ndwi = image.normalizedDifference(['B5', 'B3'])
      .rename('NDWI')
      .lt(0)
    return image.addBands(ndwi)
  })

// Construct year/month pairs that we're going to map over
var months = ee.List.sequence(1, 12)
var years = ee.List.sequence(2005, 2010).iterate(function(year, accum) {
    var years = ee.List.repeat(year, months.size())
    var yearMonths = years.zip(months)
    return ee.List(accum).cat(yearMonths)
  }, ee.List([]))
var images = ee.List(years)
  .map(function(dateList) {
    dateList = ee.List(dateList)
    var year = dateList.get(0)
    var month = dateList.get(1)
    var day = 1
    var startDate = ee.Date.fromYMD(year, month, day)
    var endDate = startDate.advance(1, 'month')
    var landsat7 = imageCollection
      .filterBounds(Maradi)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUD_COVER', 20))
      .map(maskLandsat)
      .map(function(image) {
        var ndwi = image.normalizedDifference(['B5', 'B3'])
          .rename('NDWI')
          .lt(0) // Mask each pixel by is / is not water, ie, NDWI less than one
          .multiply(ee.Image.pixelArea()) // Get the area of each pixel
        return image.addBands(ndwi)
      })
      .mean()
      .set('system:time_start', startDate)
      .set('system:time_end', endDate)
    return landsat7
  })
var landsat7 = ee.ImageCollection(images)

print(landsat7)
Map.addLayer(landsat7, { bands:'NDWI'})
Map.addLayer(ee.Image(landsat7.first()))
var chart = ui.Chart.image.series(landsat7.select('NDWI'), Maradi, ee.Reducer.sum(), 90)
    .setChartType('LineChart')
    .setOptions({
      pointSize: 3
    });

print(chart)

function make_timeseries(image_collection, geometry) {
  var pixel_area = 0.0009
  image_collection = ee.ImageCollection(image_collection)
  // Get the class areas for each image in our collection, using map
  var area_collection = image_collection.map(function(image) {
    var pixelCounts = image
      .rename('water_area')
      .reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        geometry: geometry,
        maxPixels: 1e13,
        scale: 30
      })
      .get('water_area')
    var classAreas = ee.Dictionary(pixelCounts)
      .map(function(key, value) {
        return ee.Number(value).multiply(pixel_area)
      })
    return ee.Feature(null, classAreas)
  })
  // Set a property on the feature collection, that contains the classes
  // present for the first image.
  // area_collection = ee.FeatureCollection(area_collection)
  //   .set('classes', ee.Feature(ee.FeatureCollection(area_collection).first()).toDictionary().keys())
  // var labels = names.select(area_collection.get('classes')).getInfo()
  var timeseries = ui.Chart.feature.byFeature(area_collection)
    .setChartType('LineChart')
    .setOptions({
        title: 'Water by Month',
        vAxis: {
          title: 'km^2',
          // scaleType: 'log'
        },
        hAxis: {
          title: 'Month'
        }
      })
  print(timeseries)

  return area_collection
}
var annual_areas = make_timeseries(landsat7, Maradi)
print(annual_areas)
