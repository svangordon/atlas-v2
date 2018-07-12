---
title: "Improving Data Inputs"
teaching: 0
exercises: 0
questions:
- How do I create a time series for a given location?
- How can I plot that time series within Google Earth Engine?
- "How do I make that plot interactive?"
objectives:
- "Load high resolution crop imagery."
- "Dynamically select lat/longs for creating time series plots."
- "Create a time series of NDVI and EVI for a selected point."
keypoints:
- "Time series data can be extracted and plotted from Image Collections for points and regions."
- "GEE has increasing functionality for making interactive plots."
- "The User Interface can be modified through the addition of widget."

---

## Overview

We've spoken about ways to improve the data coming in to our classifier. We will now talk about how to improve the performance of our classifier itself.

There are a few topics that we will discuss:
* Exploring different classifier types.
* Adjusting classifier parameters
* Tuning classifier hyperparameters
* Using batch exports for longer running jobs
* Performing classification offline (TensorFlow)
