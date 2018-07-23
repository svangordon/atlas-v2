---
title: "Percipitation Timeseries"
---
~~~
/*
    We are going to create a collection of time series data for precipitation in
  Benin. Yesterday, we created a collection, and mapped over it. This time, we
  are going to create an ee.List (which is similar to a JavaScript list) and then
  we will map over that. The years will act as the input for our filterDate.
*/

// First, let us create our region of interest.
 // We are interested in precipitation for a single country. We load a Feature Collection
// from Earth Engine that contains country boudaries, and select our country.
var ecowas = ee.FeatureCollection("users/svangordon/ecowas");
var region = ecowas.filter(ee.Filter.eq('NAME', 'Burkina Faso'))
Map.addLayer(region)
Map.centerObject(region)
var getPrecipitation = function(image) {
  var precipitation = ee.Image(image).reduceRegion({
      geometry: region,
      reducer: ee.Reducer.mean(),
      maxPixels: 1000000000
    })
  return ee.Feature(null, precipitation)
}

var getAnnualPrecipitation = function(year) {
  // We want the precipitation data for a given year.
  var startDate = ee.Date.fromYMD(year, 1, 1)
  var endDate = ee.Date.fromYMD(year, 12, 31)
  var precipitation = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD")
    .filterDate(startDate, endDate)
    .map(getPrecipitation)
    .aggregate_sum('precipitation')
  precipitation = {
    precipitation: precipitation,
    year: year
  }

  return ee.Feature(null, precipitation)
}

// Now, we will use ee.List.sequence to create a list of years.
// ee.List.sequence creates a list, containing all the numbers between two numbers.
var years = ee.List.sequence(2005, 2015)

var data = years.map(getAnnualPrecipitation)

print(data)

// Let us display our data as a chart.
var graph = ui.Chart.feature.byFeature(data, 'year')
print(graph)
// Using that chart, we can also export a CSV of the precipitation for that year.
~~~
{:. .source .language-javascript}
