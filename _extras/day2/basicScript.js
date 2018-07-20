// Script for Saturday, Day 2 of Niamey Workshop

// Goal: Make a Landsat composite for the year 2017 for the country of Niger.
//

// Load Landsat 8 image collection.
// More information about LS 8 at: https://code.earthengine.google.com/dataset/LANDSAT/LC08/C01/T1_SR
var ls8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')

// Create a polygon in the Park W. We use ee.Geometry.Rectangle. We give it a list
// of coordinates. The first two are for the bottom-left. The second two are the
// coordinates for the top-right.
var parkGeometry = ee.Geometry.Rectangle(
  [
    // Coordinates for the botom-left
    2.2, 11.9,
    // Coordinates for the top-right
    2.5, 12.2
  ]
)

// Add the geometry to the map.
Map.addLayer(parkGeometry)

var processedImages = ls8
  // Select Landsat scenes within the geometry
  .filterBounds(parkGeometry)
  // Select scenes from 2017
  .filterDate('2017-01-01', '2017-12-31')
  // Select scenes covered by less than 40% cloud
  .filter(ee.Filter.lt('CLOUD_COVER', 0.4))

// Add the image to the map.
Map.addLayer(processedImages, {min: 0, max: 3000, bands:'B4,B3,B2'}, 'processed image collections')

/*
  Mosaic Images
*/
var mosaickedImage = processedImages.mosaic()
Map.addLayer(mosaickedImage, {min: 0, max: 3000, bands:'B4,B3,B2'}, 'mosaicked image')

/*
  Reduce Images (median)
*/
var medianImage = processedImages.median()
Map.addLayer(medianImage, {min: 0, max: 3000, bands:'B4,B3,B2'}, 'median image')

/*
  Clip the median Image
*/
var clippedImage = medianImage.clip(parkGeometry)
Map.addLayer(clippedImage, {min: 0, max: 3000, bands:'B4,B3,B2'}, 'clipped image')

/*
  Create a median NDVI image
*/
var medianNdvi = medianImage.normalizedDifference('B5', 'B4')
// Map.addLayer
