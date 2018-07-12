var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification

var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

var classificationArea = /* color: #d63000 */ee.Geometry.Point([-12.392578125, 12.399002919688813]);
var zoneSize = 56000
// var labelProjection = atlasImage.projection()
// var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')




var classificationZone = ee.Image.random()
  .multiply(10000000)
  .toInt()
  .reduceToVectors({
    crs: atlasImage.projection(),
    scale: zoneSize,
    geometry: classificationArea
  });

displayAtlasClassification(atlasImage.clip(classificationZone))

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
  .addBands(atlasImage)
  .clip(classificationZone)

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
  .map(function(feature) {
    var centroid = feature.centroid(5)
    return centroid
  })

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}

// var landsatData = landsatImage
//   .addBands(atlasImage)


var landsatBands = ee.List(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])


function assessClassification(trainingImage, samplingPoints, trainingBands, title) {
  var imageData = trainingImage
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: samplingPoints,
      scale: 30
    })
    .map(toPoint)
    .randomColumn('random', 0)
  var trainingSize = 0.7
  var trainingData = imageData.filter(ee.Filter.lt('random', trainingSize))
  var testingData = imageData.filter(ee.Filter.gte('random', trainingSize))
  var classifier = ee.Classifier.randomForest(20).train(trainingData, 'b1', trainingBands)

  print(title,
    "testing accuracy:", testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy(),
    "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa()
  )
  // print(title, "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa())
  displayAtlasClassification(trainingImage.classify(classifier), title)
}

assessClassification(landsatImage, samplingPoints, landsatBands, 'baseline')

/*
  Do a noisey classification
*/

var noiseyImage = landsatImage.addBands(ee.Image.random()).addBands(ee.Image.random()).addBands(ee.Image.random())
  .clip(classificationZone)
var noiseyBands = landsatBands.cat(['random', 'random_1', 'random_2'])

assessClassification(noiseyImage, samplingPoints, noiseyBands, 'noisey classification')

/*
  Add DEM data
*/
var demData = ee.Image("USGS/SRTMGL1_003")
var demImage = landsatImage.addBands(ee.Algorithms.Terrain(demData)).clip(classificationZone)
var demBands = landsatBands.cat(['elevation', 'slope', 'aspect', 'hillshade'])

assessClassification(demImage, samplingPoints, demBands, 'dem classification')


/*
  Add precipitation data
*/

var chirpsCollection = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
var chirpsData = chirpsCollection
  .filterDate('2013-01-01', '2013-12-31')
  // Resample all images in the collection. Try commenting out the next line to leave it unresampled
  .map(function(image) {return image.resample('bilinear')})
  .sum()
  .clip(classificationZone)
  // .reproject(ee.Image(landsat7Collection.first()).projection(), undefined, 30)


  var chirpsVis = {min:1400, max: 2200, palette: ['001137','0aab1e','e7eb05','ff4a2d','e90000']}
Map.addLayer(chirpsData, chirpsVis, 'Precipitation Data')

var precipitationImage = landsatImage.addBands(chirpsData)
var precipitationBands = landsatBands.cat(['precipitation'])

assessClassification(precipitationImage, samplingPoints, precipitationBands, 'precipitation classification')

/*
  Add NDVI
*/
// For Landsat 7, NIR is B4 and Red is B3. For LS 8, NIR is B5 and Red is B4
var nirBand = "B4"
var redBand = "B3"

// Calculate the NDVI for our landsat image
var ndviData = landsatImage.normalizedDifference([nirBand, redBand])
  .rename('ndvi')

// Visualize the resulting NDVI
var ndviVis = {
  min: 0,
  max: 1,
  palette: ["ffffff","ce7e45","df923d","f1b555","fcd163","99b718","74a901","66a000","529400","3e8601","207401","056201","004c00","023b01","012e01","011d01","011301"]
}
Map.addLayer(ndviData, ndviVis, 'ndvi')

var ndviImage = landsatImage.addBands(ndviData.clip(classificationZone))
var ndviBands = landsatBands.cat(['ndvi'])

assessClassification(ndviImage, samplingPoints, ndviBands, 'ndvi classification')

// // Drop bands 4 and 3
// assessClassification(ndviImage, samplingPoints, ['B1', 'B2' ,'B5', 'B7', 'ndvi'], 'ndvi classification, no B3 or B3')

/*
  Multi Season Images
*/
// Display the precipitation time series
print(ui.Chart.image.series(chirpsCollection.filterDate('2013-01-01', '2013-12-31'), classificationZone));

// Construct a function to get an early year filter
function getEarlyYearFilter(year) {
  return ee.Filter.or(
    ee.Filter.date( year - 1 + '-03-15',  year - 1 + '-04-15'),
    ee.Filter.date( year     + '-03-15',  year     + '-04-15'),
    ee.Filter.date( year + 1 + '-03-15',  year + 1 + '-04-15')
  )
}

var earlyYearLandsat = landsat7Collection
  .filterBounds(classificationZone)
  .filter(getEarlyYearFilter(2013))
  .map(maskLandsat)
  .median()
  .clip(classificationZone)

var multiSeasonImage = landsatImage.addBands(earlyYearLandsat)

print(multiSeasonImage)

// print(multiSeasonImage.bandNames())
//
// var multiSeasonBands = landsatBands.cat(landsatBands.map(function(band) {
//   return ee.String(band).cat('_1')
// }))

var multiSeasonBands = multiSeasonImage.bandNames().remove('b1')

assessClassification(multiSeasonImage, samplingPoints, multiSeasonBands, 'multiseason classification')
