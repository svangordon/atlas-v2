var atlasRawClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]

/*
  Load and export Atlas images and collection
*/
// Import Atlas Images and collection. We've changed the preferred names since this.
var atlasV1_2000 = ee.Image('users/svangordon/walt2000')
var atlasV1_2013 = ee.Image('users/svangordon/walt2013')
var atlasV1 = ee.ImageCollection([
  atlasV1_2000,
  atlasV1_2013
])

var atlas_1975 = ee.Image("users/svangordon/conference/atlas/swa_1975lulc_2km")
var atlas_2000 = ee.Image("users/svangordon/conference/atlas/swa_2000lulc_2km")
var atlas_2013 = ee.Image("users/svangordon/conference/atlas/swa_2013lulc_2km")
var atlasCollection = ee.ImageCollection('users/svangordon/conference/atlas/atlasCollection')

exports.atlas_1975 = atlas_1975
exports.atlas_2000 = atlas_2000
exports.atlas_2013 = atlas_2013
exports.atlasCollection = atlasCollection

/*
  Load and export Atlas V2 Collection
*/
var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
var atlasV2_2000 = ee.ImageCollection('users/svangordon/conference/atlas_v2/classify/2000')
var atlasV2_2013 = ee.ImageCollection('users/svangordon/conference/atlas_v2/classify/2013')
exports.atlasV2Collection = atlasV2Collection
exports.atlasV2_2000 = atlasV2_2000
exports.atlasV2_2013 = atlasV2_2013


var zoneGeometries = require('users/svangordon/west-africa-lulc:zoneGeometries')

var zoneGeometriesWithIds = ee.FeatureCollection(
  zoneGeometries.map(function(aoi, index) {
    return ee.Feature(aoi, {
      aoiId: index
    })
  })
)

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

// function renderClassification(image, title) {
//   var classificationVis = {
//     min:1, max:atlasRawClasses.length, bands: ['remapped'],
//     palette: atlasPalette
//   };
//   image = image.addBands(image.remap(atlasRawClasses, ee.List.sequence(1, atlasRawClasses.length)))
//   Map.addLayer(image, classificationVis, 'Classification' + ' ' + title)
// }

function displayAtlasClassification(atlasImage, layerName) {
  var remappedImage = atlasImage.remap(atlasRawClasses, ee.List.sequence(1, atlasRawClasses.length))
  atlasImage = atlasImage.addBands(remappedImage)
  var atlasViz = {
    min: 1,
    max: atlasRawClasses.length,
    bands: ['remapped'],
    palette: atlasPalette
  };
  Map.addLayer(atlasImage, atlasViz, layerName)
}

var renderClassification = displayAtlasClassification

// Convert longitude and latitude bands to a geometry. Make sure to add lon/lat
// bands to the image that you are sampling using ee.Image.pixelLonLat
function toPoints(fc) {
  return ee.FeatureCollection(fc).map(function(f) {
    f = ee.Feature(f)
    return ee.Feature(
      ee.Geometry.Point([f.get('longitude'), f.get('latitude')]),
      f.toDictionary().remove(['longitude', 'latitude']))
  })
}

function getAccuracyByClass(testingData, classProperty) {
  testingData = ee.FeatureCollection(testingData)

  // Get the classes present in the testing set
  var testingClasses = getDistinctClasses(testingData, classProperty)

  // Create an errorMatrix for the classes in question
  var errorMatrix = testingData
    .errorMatrix(classProperty, 'classification', testingClasses)

  return errorMatrix.producersAccuracy()

  // Take the producers accuracy, and reproject it from a one dimensional matrix
  // into 0 dimensions, and then convert it into a list.
  var producersAccuracy = errorMatrix.producersAccuracy().project([0]).toList()
  var accuracyByClass = testingClasses.map(function(classId) {
    return producersAccuracy.get(ee.Number.parse(classId))
  })

  return ee.Dictionary.fromLists(testingClasses, accuracyByClass)
}

/*
  Given a year, return the  6 seasons for that year. Used to construct time filters.
  The slice at the end limits it to only one season; remove that (or otherwise
  adjust it) if you would like more than one season.
*/
function getSeasons(year) {
  return getFilters(getSplits(ee.Number(year)))
}

function getEarlyDrySeason(year) {
  return getSeasons(year).slice(4, 5)
}

/*
  Generate 6 generic splits to be used in generate seasons
*/
function getSplits(year) {
  var startDate = ee.Date.fromYMD(year, 1, 15);
  var endDate = startDate.update(ee.Number(year).add(1));
  // var dates = [];
  var seasonLength = 60;
  var yLength = 365;

  var dates = ee.List.sequence(0, 5)
    .map(function(season) {
      var advanceLength = ee.Number(season).multiply(seasonLength)
      return startDate.advance(advanceLength, 'day')
    })
  dates = dates.add(endDate)
  return dates
}

/*
  Given a list of dates, create the filters for that season ± 1 year
*/
function getFilters(dates) {
  var startDates = dates.slice(0, -1)
  var endDates = dates.slice(1)
  var dateRanges = startDates.zip(endDates)
    .map(function(dates) {
      var startDate = ee.Date(ee.List(dates).get(0))
      var endDate = ee.Date(ee.List(dates).get(1))
      return ee.Filter.or(
        ee.Filter.date(startDate.advance(-1, 'year'), endDate.advance(-1, 'year')),
        ee.Filter.date(startDate.advance(0, 'year'), endDate.advance(0, 'year')),
        ee.Filter.date(startDate.advance(1, 'year'), endDate.advance(1, 'year'))
      )
    })
  return dateRanges
}

// function getFilters(dates) {
//   var filters = []
//   for (var i = 0; i < dates.length - 1; i++) {
//     var filter = ee.Filter.or(
//       ee.Filter.date( dates[i].advance(-1, 'year'),  dates[i + 1].advance(-1, 'year')),
//       ee.Filter.date( dates[i].advance( 0, 'year'),  dates[i + 1].advance( 0, 'year')),
//       ee.Filter.date( dates[i].advance( 1, 'year'),  dates[i + 1].advance( 1, 'year'))
//     )
//     filters.push(filter)
//   }
//   return filters
// }

function maskLandsatImage(image) {
  // Cast the input image to an ee.Image
  image = ee.Image(image)

  // Get the pixel QA band.
  var qa = image.select('pixel_qa')

  // Bits 0, 3, 4 and 5 are fill, cloud shadow, snow, and cloud.
  var fillBit = ee.Number(2).pow(0).int()
  var cloudShadowBit = ee.Number(2).pow(3).int()
  var snowBit = ee.Number(2).pow(4).int()
  var cloudBit = ee.Number(2).pow(5).int()

  var radsat = image
    .select('radsat_qa')
    .rename('pixel_qa') // Rename from 'radsat_qa' to 'pixel_qa' so all bands have same name
    .int()

  // Put all of our masks into an image collection, and combine them
  // with .and()
  var mask = ee.ImageCollection([
    // QA Masks
    qa.bitwiseAnd(cloudShadowBit).eq(0),
    qa.bitwiseAnd(fillBit).eq(0),
    qa.bitwiseAnd(snowBit).eq(0),
    qa.bitwiseAnd(cloudBit).eq(0),
    // Radsat Mask
    radsat.eq(0)
  ]).and()
  return image
    .updateMask(mask)
    .select('B.+')
}

function getCenterPoints(geometry, image) {
  // Get the images projection and scale.
  var crs = ee.Image(image).projection()
  var scale = crs.nominalScale()

  // Construct an image where each pixel is a random value, and we are certain
  // that no adjacent pixels have the same value. Then reduce that image to a
  // collection of polygons of size `scale`. then convert each polygon to its
  // centroid, with an error margin of 10m.
  var centerpoints = ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: crs,
      geometry: geometry,
      scale: scale
    })
    .map(function(feature) {
      var centroid = feature.centroid(10)
      return centroid
    })
  return centerpoints
}

function sampleCollection(featureImages, labelImage, samplingGeometry) {
  // Cast feature images to an image collection
  featureImages = ee.ImageCollection(featureImages)

  // What scale we want to sample at. Remember, we always want to pass
  // A scale to Earth Engine. Landsat is at 30m; if we switch to a different satellite
  // dataset (for example, Sentinel) we will need to change this
  var samplingScale = 30;

  return featureImages.map(function(featureImage) {
    var datapoints = featureImage
    .addBands(labelImage)
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: ee.FeatureCollection(samplingGeometry),
      scale: samplingScale
    })
    return toPoints(datapoints)
  }).flatten()
}

function trainTestSplit(collection, trainingSize) {

  // Add a column with a random value between 0.0 and 1.0 to each feature.
  // Provide a seed number (0) so that the results are consistent across runs.
  var withRandom = collection.randomColumn('random', 0);

  // Any features with a random value below our training size value go in training;
  // the rest go in testing.
  var trainingPartition = withRandom.filter(ee.Filter.lt('random', trainingSize));
  var testingPartition = withRandom.filter(ee.Filter.gte('random', trainingSize));
  return [trainingPartition, testingPartition]
}

function getDistinctClasses(collection, classProperty) {
  var classes = collection.aggregate_histogram(classProperty)
  classes = ee.Dictionary(classes)
    .keys()
    .map(function(classId) {
      return ee.Number.parse(classId)
    })
    .sort()
  return classes
}

/*
  Assess the accuracy of a classification, both overall and per-class.
  Parameters:
    testingCollection
    classifier
    classProperty
  output:
    Object with accuracy and accuracyByClass
*/
function assessClassification(testingCollection, classifier, classProperty) {
  // Get the distinct classes in the testing collection
  var testingClasses = getDistinctClasses(testingCollection, classProperty)
  // Classify the collection
  var classifiedCollection = testingCollection.classify(classifier)
  var errorMatrix = classifiedCollection.errorMatrix(classProperty, 'classification', testingClasses)
  var accuracy = errorMatrix.accuracy()
  var accuracyByClassList = errorMatrix
    .producersAccuracy()
    .project([0])
    .toList()
  var accuracyByClass = ee.Dictionary.fromLists(testingClasses.map(ee.String), accuracyByClassList)
  print('accuracy', accuracy)
  print('accuracyByClass', accuracyByClass)
  return ee.Dictionary({
    "accuracy": accuracy,
    "accuracyByClass": accuracyByClass
  })
}

function countsToAreas(reducerOutput, conversionCoefficient) {
  var classBand = 'b1'
  // Get class band and cast to Dictionary; .get call makes casting necessary
  var classCounts = ee.Dictionary(reducerOutput.get(classBand))
    .remove(['null'], true) // Drop any null values; (ie, any pixels that don't have data).

  // Multiply the counts by the conversion coefficient
  var classAreas = classCounts.map(function(key, value) {
    return ee.Number(value).multiply(conversionCoefficient)
  })
  return classAreas
}

function displayClassificationCollection(classificationCollection) {
  // Create a list of strings that are valid as EE dates (YYYY-MM-DD)
  var atlasV2Years = [
    "2000-01-01",
    "2001-01-01",
    "2002-01-01",
    "2003-01-01",
    "2004-01-01",
    "2005-01-01",
    "2006-01-01",
    "2007-01-01",
    "2008-01-01",
    "2009-01-01",
    "2010-01-01",
    "2011-01-01",
    "2012-01-01",
    "2013-01-01",
    "2014-01-01",
    "2015-01-01",
    "2016-01-01",
  ]

  atlasV2Years.forEach(function(year) {
      var classificationImage = classificationCollection
        .filterDate(year)
        .first()
      displayClassification(classificationImage, "Atlas V2 " + year)
    })
}

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
  Map.addLayer(remappedImage, {min:1, max:26, palette: atlasPalette}, layerName)
}


exports.renderClassification = renderClassification;
exports.atlasRawClasses = atlasRawClasses;
exports.atlasV1_2000 = atlasV1_2000
exports.atlasV1_2013 = atlasV1_2013
exports.atlasV1 = atlasV1
exports.getAccuracyByClass = getAccuracyByClass
exports.getSeasons = getSeasons
exports.getEarlyDrySeason = getEarlyDrySeason
exports.maskLandsatImage = maskLandsatImage
exports.zoneGeometries = zoneGeometries
exports.getCenterPoints = getCenterPoints
exports.sampleCollection = sampleCollection
exports.trainTestSplit = trainTestSplit
exports.getDistinctClasses = getDistinctClasses
exports.assessClassification = assessClassification
exports.zoneGeometriesWithIds = zoneGeometriesWithIds
exports.toPoints = toPoints
exports.atlasPalette = atlasPalette
exports.displayAtlasClassification = displayAtlasClassification
exports.countsToAreas = countsToAreas
exports.displayClassification = displayClassification
exports.displayClassificationCollection = displayClassificationCollection
