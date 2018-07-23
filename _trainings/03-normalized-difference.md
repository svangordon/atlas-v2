---
title: "Normalized Difference"
---

~~~
/*
  Normalized difference

    Normalized difference bands (also called spectral indices)
  express a relationship between two bands. You are all likely familiar with
  a number of normalized diference bands, such as Normalized Difference
  Vegetation Index (NDVI), Normalized Difference Moisture Index (NDMI),
  or Normalized Burn Ratio (NBR).

    Earth Engine makes calculating normalized difference bands simple, using the
  .normalizedDifference method.

    For this exercise, we will calculate and display normalized difference bands
  for a Landsat image and time series.
*/

/*
    To calculate spectral indices, we are going to use the ee.Image().normalizedDifference()
  function. Using the Docs tab, we can see that normalizedDifference() is a function
  that acts on an image. It has one input: a list containing the names of the
  two bands that are to be used for the normalized difference calculation. The
  returned value is an image where each pixel is equal to:
    (first − second) / (first + second)

*/

// First, we will load a single Landsat 8 image. I have chosen a Landsat 8 image
// to test our code on. I found its ID by printing a collection to the map and
// reading its ID.

var landsatImage = ee.Image("LANDSAT/LC08/C01/T1_TOA/LC08_192052_20170219")

/*
    We now need to determine what bands we are going to use for different spectral
  indices. Using the Docs tab, we saw that the function's input is a list of strings
  representing the names of the bands we are going to use for our calculations.
  We can use the Landsat spectral indices guide (https://landsat.usgs.gov/sites/default/files/documents/si_product_guide.pdf)
  to see which bands to use for different indices. For now, we will only use NDVI.
*/

var landsatNdviBands = ["B5", "B4"]

var landsatNdviImage = landsatImage.normalizedDifference(landsatNdviBands)

/*
    Now, let's add our NDVI image to the map. We will give it a palette from the colors
  'brown' to the color 'green', and it will stretch the values between these two colors.
  Using the inspector, you can click around on your NDVI image to see what values are present.
  Based on what values you see, choose a min and max value for your visualiztion.
  (replace the null values below)
*/

Map.addLayer(landsatNdviImage, {min: null, max: null, palette: 'brown,green'}, 'landsat_ndvi')

/*
  Compare your image with your neighbor.
*/

/*
Sentinel NDVI
  We have created a Landsat NDVI. Now, let's create a Sentinel NDVI. The Sentinel 2
NDVI bands are Bands 4 and 8 (I think...)
*/

// First, we load a Sentinel 2 image.
var sentinelImage = ee.Image("COPERNICUS/S2/20160916T101022_20160916T171853_T31PDP")
// Now we decide on our normalizedDifference bands.
var sentinelNdviBands = ["B4", "B8"]
var sentinelNdviImage = sentinelImage.normalizedDifference(sentinelNdviBands)
Map.addLayer(sentinelNdviImage, {min: null, max: null, palette: 'brown,green'}, 'Landsat NDVI')
/*

  =====
  Exercises
  =====
*/

/*
  Getting NDMI
    Let's try getting a different kind of spectral index. In Landsat 8, the NDMI bands
  are Band 5 and Band 6. The code below almost works, but it's missing a little bit.
  Replace the null values to make the code work.
*/
var landsatNdmiBands = [null, null]
var landsatNdmiImage = landsatNdmiImage.normalizedDifference(null)
Map.addLayer(landsatNdmiImage, {min: null, max: null, palette: 'white,blue'}, 'Landsat NDMI')

/*
  getNdvi function
    It would be quite convenient if we could create a function that would calculate
  an image's NDVI and return it. Let's create a function called getNdvi that takes
  a Landsat 8 image as an input and returns that image's NDVI. Replace the null values.
*/
var getNdvi = function (landsatImage) {
  var landsatNdviBands = null
  var landsatNdviImage = null
  return landsatNdviImage
}

// Now we can assess our function's output with
Map.addLayer(getNdvi(landsatImage), {min:null, max:null, palette:'brown,green'})

/*
  ======
  Extra
  ======
  (The following is advanced. We won't go over it in the workshop, but you may find
  it useful.)

  Custom Expressions
    We saw how to generate a normalized difference index. That calculation
  is fairly simple. It is possible to use custom defined indices instead. We will
  use the example of Enhanced Vegetation Index.
*/
// To generate our EVI, we use ee.Image().expression. This takes two arguments:
// a string defining the arithmetic function to be used to calculate the index,
// and an optional dictionary, that creates variables that we can use in our expression.
// You can read more in the Docs tag.

// The first argument is the expression to be used to calculate the EVI value.
// For each pixel, any variables like 'nir', or 'red' are replaced with the
// value defined in the dictionary below. Then, the equation is evaluated by the
// earth engine servers.
var landsatEvi = landsatImage.expression(
  '2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)',
  // The keys of this dictionary provide the variable names for the expression above.
  {
      'red': landsatImage.select('B3'),
      'nir': landsatImage.select('B4'),
      'blue': landsatImage.select('B1')
  })
~~~
{:. .source .language-javascript}
