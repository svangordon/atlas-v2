function getClassificationZone(pointGeometry, zoneSize) {
  var atlasProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: atlasProjection,
      scale: zoneSize,
      geometry: pointGeometry
    })
}

function getPoints(zoneGeometry) {
  var labelProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      scale: labelProjection.nominalScale()
    })
    .map(function(feature) {
      var centroid = feature.centroid(5)
      return centroid
    })
}

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
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
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
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

var zoneSize = 56000

// Create classification zone
var classificationPoint = ee.Geometry.Point([-12.392578125, 12.399002919688813]);

var classificationZone = getClassificationZone(classificationPoint, zoneSize)

// Load Atlas image for labels
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

// Create a time filter for 2013
var timeFilter = ee.Filter.or(
    ee.Filter.date('2012-09-15', '2012-11-15'),
    ee.Filter.date('2013-09-15', '2013-11-15'),
    ee.Filter.date('2014-09-15', '2014-11-15')
  )

// Load Landsat 7 collection
var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

// Create input image for zone
var zoneImage = landsat7Collection
  .filterBounds(classificationZone)
  .filter(timeFilter)
  .map(maskLandsat)
  .median()
  .addBands(atlasImage)
  .clip(classificationZone)

// Sample input image


// Create neighbor zone
var neighborZonePoint = ee.Geometry.Point([-12.444763162638992, 12.427175804835738]);

var neighborZone = getClassificationZone(neighborZonePoint, zoneSize)
