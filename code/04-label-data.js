var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

var classificationArea = /* color: #d63000 */ee.Geometry.Point([-12.392578125, 12.399002919688813]);
var zoneSize = 56000
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
// var labelProjection = atlasImage.projection()



var classificationZone = ee.Image.random()
  .multiply(10000000)
  .toInt()
  .reduceToVectors({
    crs: atlasImage.projection(),
    scale: zoneSize,
    geometry: classificationArea
  });

function getLateYearFilter(year) {
  return ee.Filter.or(
    ee.Filter.date( year - 1 + '-09-15',  year - 1 + '-11-15'),
    ee.Filter.date( year     + '-09-15',  year     + '-11-15'),
    ee.Filter.date( year + 1 + '-09-15',  year + 1 + '-11-15')
  )
}

function maskLandsat(image) {
  // Bits 0, 3, 4 and 5 are fill, cloud shadow, snow, and cloud.
  var fillBit = ee.Number(2).pow(0).int()
  var cloudShadowBit = ee.Number(2).pow(3).int()
  var snowBit = ee.Number(2).pow(4).int()
  var cloudBit = ee.Number(2).pow(5).int()

  // Get the pixel QA band.
  var qa = image.select('pixel_qa')

  var radsatMask = image
    .select('radsat_qa')
    .eq(0)

  var mask = radsatMask
    .and(qa.bitwiseAnd(cloudShadowBit).eq(0))
    .and(qa.bitwiseAnd(fillBit).eq(0))
    .and(qa.bitwiseAnd(snowBit).eq(0))
    .and(qa.bitwiseAnd(cloudBit).eq(0))
    // .and(image.select('sr_atmos_opacity').lte(300))

  return image
    .updateMask(mask)
    .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])
}

var landsatImage = landsat7Collection
  .filterBounds(classificationZone)
  .filter(getLateYearFilter(2013))
  .map(maskLandsat)
  .median()
  .clip(classificationZone)

Map.addLayer(landsatImage, {min:0, max:3000, bands: "B3, B2, B1"}, "Landsat Image")

// Code up to this point available at: https://code.earthengine.google.com/d40f69f81e87fba274f804806f8df661

var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var labelProjection = atlasImage.projection()

var samplingPoints = ee.Image
  .random()
  .multiply(100000)
  .toInt()
  .reduceToVectors({
    crs: labelProjection,
    geometry: classificationZone,
    scale: labelProjection.nominalScale()
  })
  .aside(function(pixelVectors) {
    Map.addLayer(pixelVectors, {}, 'vectorized Atlas pixels')
  })
  .map(function(feature) {
    var centroid = feature.centroid(5)
    return centroid
  })

Map.addLayer(samplingPoints)

var landsatData = landsatImage.sampleRegions({
  collection: samplingPoints,
  scale: landsatImage.projection().nominalScale()
})
print(landsatData)
Map.addLayer(landsatData)

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}
landsatData = landsatImage
  .addBands(ee.Image.pixelLonLat())
  .addBands(atlasImage)
  .aside(function(collection) {
    print(collection)
  })
  .map(toPoint)
  .aside(function(collection) {
    print(collection)
  })
