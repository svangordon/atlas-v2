/*
  Functions:
    * displayClassification
    * displayLandsat7SR
    * getLabelLocations (getSamplingPoints)
    * getTrainingInputs (sampleCollection)
    * trainAlgorithm    (trainClassifier)
*/

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
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
}

/*
  getLabelLocations
    Create a collection of ~~center~~points at a given projection. Used for creating
  the collection from which we will sample our basemap.

  Parameters:
    - zoneGeometry (ee.Geometry): The geometry within which we will create our collection of points.
    - [projectionImage] (ee.Image, default: Atlas 2013): The image whose projection
    we will use for the collection of points.
  Returns:
    ee.FeatureCollection (GeometryCollection)

*/
function getLabelLocations(zoneGeometry, projectionImage) {
  zoneGeometry = ee.FeatureCollection(zoneGeometry).geometry()
  projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  var projection = projectionImage.projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: projection,
      geometry: zoneGeometry,
      scale: projection.nominalScale(),
      geometryInNativeProjection: true
    })
    .map(function(feature) {
      var centroid = feature.centroid(5)
      return centroid
    })
}

/*
  toPoint
    Takes a feature with `longitude` and `latitude` properties, strips those properties,
  and converts them into a geometry. Used so that features have geometries after a
  `.sampleRegions` call.
*/
function toPoint(feature) {
  // ? under the hood?
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}

function getTrainingInputs(basemap, labels, samplingGeometry, samplingScale) {
  // Use the or operator (which is ||) to set a default value for sampling scale
  samplingScale = samplingScale || 30;
  basemap = ee.Image(basemap)
  labels = ee.Image(labels)
  samplingGeometry = ee.FeatureCollection(samplingGeometry)

  return basemap.addBands(labels)
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: samplingGeometry,
      scale: samplingScale
    })
    .map(toPoint)
}

/*
  Train algorithm. Returns a trained collection.
*/
function trainAlgorithm(inputData, trainingBands) {
  var trainingSize = 0.7
  inputData = inputData.randomColumn()
  var trainingData = inputData.filter(ee.Filter.lt('random', trainingSize))
  var testingData = inputData.filter(ee.Filter.gte('random', trainingSize))
  var algorithm = ee.Classifier.randomForest(20)
    .train(trainingData, 'b1', trainingBands)
  var testingAccuracy = testingData.classify(algorithm).errorMatrix('b1', 'classification').accuracy()

  return ee.Feature(null, {
    accuracy: testingAccuracy,
    algorithm: algorithm
  })
}

exports.displayClassification = displayClassification;
exports.getLabelLocations = getLabelLocations;
exports.toPoint = toPoint;
exports.getTrainingInputs = getTrainingInputs;
exports.trainAlgorithm = trainAlgorithm;
