---
title: "End of Day 2 Script"
---
~~~

var ls8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA")
// Create an area of interest for our study
var aoi = ee.Geometry.Rectangle([
  // Coordinates for the bottom left
  2.2, 11.9,
  // Coordinates for the top-right
  2.5, 12.2
  ])
// Map.addLayer(aoi, {}, 'Area of Interest')



var filteredImages = ls8.filterBounds(aoi)
print(filteredImages.size())
filteredImages = filteredImages
  .filterDate("2017-01-01", "2017-12-31")
print(filteredImages.size())
print(filteredImages)

// Use a less than filter to filter cloudy scenes
// CLOUD_COVER is a value from 0.0 to 1.0
filteredImages = filteredImages.filter(ee.Filter.lt('CLOUD_COVER', 0.4))
print(filteredImages.size())
// Map.addLayer(filteredImages,
//   {min:0, max:0.3, bands:'B3,B2,B1'},
//   'filtered collection')

// Center the map view on the filtered images
// Map.centerObject(filteredImages)

// Create a composited image, taking median pixel value
var compositedImage = filteredImages.median()
print(compositedImage)


// Map.addLayer(compositedImage,
//   {min:0.0, max:0.3, bands:"B3,B2,B1"},
//   "composited image")



var clippedImage = compositedImage.clip(aoi)
Map.addLayer(clippedImage, {min:0.0, max: 0.3, bands: "B3,B2,B1"}, "Clipped")

var ndviImage = clippedImage.normalizedDifference(['B5', 'B4'])
// Map.addLayer(ndviImage,
//   {min:-1, max:1, palette: 'ffffff,ce7e45,df923d,f1b555,fcd163,99b718,74a901,66a000,529400,3e8601,207401,056201,004c00,023b01,012e01,011d01,011301'}, 'NDVI')
  Map.addLayer(ndviImage,
  {min:-0.1, max:0.3, palette: ['black', 'white']}, 'NDVI')
Export.image.toDrive({
  description: 'taskNumber1',
  image: ndviImage,
  maxPixels: 10000000000000,
  region: aoi
})

var meanNdvi = ndviImage.reduceRegion({
  geometry: aoi,
  reducer: ee.Reducer.mean(),
  scale: 30,
  maxPixels: 1000000000
})
print(meanNdvi)
print(landsat8Ndvi)
~~~
{:. .source .language-javascript}
