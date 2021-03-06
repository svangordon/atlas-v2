---
title: "NDVI Timeseries"
---
~~~

// var geometry = ee.Geometry.Point([2.5, 12])
var geometry = ee.Geometry.Rectangle(
  [
    // Coordinates for the botom-left
    2.2, 11.9,
    // Coordinates for the top-right
    2.5, 12.2
  ]
)

var ls8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')

var getNdvi = function(image) {
  return image.normalizedDifference(['B5', 'B4'])
}

var getMean = function(image) {
  var result = image.reduceRegion({
    geometry: geometry,
    reducer: ee.Reducer.mean(),
    scale: 30,
    maxPixels: 1e13
  })
  return ee.Feature(null, result)
}

/*
// Return the total precipitation for an image's footprint in the 16 days prior to
// an image. Add it as a band to an image.
var getPrecipitationData = function(image) {
  // We want to get the total percipitation for the 16 days prior to the landsat
  // image. We take the end date as the image's date, and we take the start date
  // as sixteen days before the date.
  var endDate = image.date()
  var startDate = endDate.advance(-16, 'day')
  var percipitationData = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
    .filterDate(startDate, endDate)
    .sum()
  return image.addBands(percipitationData)
}
*/
var ndviOverTime = ls8.filterBounds(geometry)
  .filterDate('2016-01-01', '2016-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 0.4))
  .map(getNdvi)
  .aside(function(ndviCollection) {
    Map.addLayer(ndviCollection, {min: -0.1, max:0.3, palette:['black', 'white']})
  })
  // .map(getPrecipitationData)
  .map(getMean)

print(ndviOverTime)
Export.table.toAsset(ndviOverTime)

var getAnnualNdvi = function(year) {
  var yearStart = ee.Image.fromYMD(year, 1, 1)
  var yearEnd = ee.Image.fromYMD(year, 12, 31)
  var annualNdvi = ls8.filterBounds(geometry)
    .filterDate(yearStart, yearEnd)
    .filter(ee.Filter.lt('CLOUD_COVER', 0.4))
    .map(getNdvi)
    .map(getMean)
  return annualNdvi
}

var annualNdvi = ee.List.sequence(2014, 2016)
~~~
{:. .source .language-javascript}
