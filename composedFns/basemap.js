/*
  getClassificationZone:
    Creates a collection of zoneSize * zoneSize geometries in a given projection,
   which will use as the areas in which we performa a classification. Returns as
   many geometries as cover a given zone.
  Arguments:
    - boundaryGeometry (ee.Geometry): The geometry to which we will limit ourselves.
    - [zoneSize] (Number, default: 56000): Size, in meters, of each side of the classification zone.
    - [projectionImage] (ee.Image, default: Atlas 2013)]: The image whose projection
    will be used for the classification zones.
*/
function getClassificationZone(boundaryGeometry, zoneSize, projectionImage) {
  zoneSize = zoneSize || 56000
  projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  boundaryGeometry = ee.FeatureCollection(boundaryGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
  var projection = ee.Image(projectionImage).projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: projection,
      scale: zoneSize,
      geometry: boundaryGeometry,
      geometryInNativeProjection: true
    })
}
