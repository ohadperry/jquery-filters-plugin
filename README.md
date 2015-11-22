# Filters
No Download Needed. jQuery filters rending out of the box for backoffice use.

<img src="https://badge.fury.io/js/backoffice-filters.png" />

<a href="http://ohadpartuck.github.io/filter_demo/" target="_blank">demo</a>

![Sample](https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/master/demo/filters_demo.gif)

# Quick Start
```
<!DOCTYPE html>
<html>
<head>
    <title>Jquery Backoffice Filters Plugin</title>
    <meta name="description" content="A jquery plugin for generating a backoffice filter">

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
    <script src="http://momentjs.com/downloads/moment.min.js"></script>
    <script src="https://cdn.rawgit.com/dangrossman/bootstrap-daterangepicker/master/daterangepicker.js"></script>
    <script src="https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/v0.1.1/jquery.filters.js" type="text/javascript"></script>

    <link rel="stylesheet" media="all" href="https://cdn.rawgit.com/dangrossman/bootstrap-daterangepicker/master/daterangepicker-bs3.css">
    <link rel="stylesheet" media="all" href="https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/v0.1.1/css/jquery.filters.css">
    <link rel="stylesheet" media="all" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">
</head>
<body>
  <div id="wrapper">
      <div id="filter"></div>
  </div> 

 </body>
  <script type="text/javascript">
      function sendToServer(data){
          alert('sending params to server: ' + JSON.stringify(data));
      }

      var devicesOptions = [{name: 'LGE', value: 'LGE'}, {name: 'Apple', value: 'Apple'}, {name: 'Samsung', value: 'Samsung'}],
              productOptions = [
                  {name: 'Product Name 1', value: 'product_name_1', selected: true},
                  {name: 'Product Name 2', value: 'product_name_2'},
                  {name: 'Product Name 3', value: 'product_name_3'},
                  {name: 'Product Name 4', value: 'product_name_4'},
                  {name: 'Product Name 5', value: 'product_name_5'},
                  {name: 'Product Name 6', value: 'product_name_6'},
              ],
              operatingSystemVersionOptions = [
                  {name: '8.1 (ios)', value: '8.1'},
                  {name: '8.2 (ios)', value: '8.2'},
                  {name: '5.5 (kitkat)', value: '5.5'}
              ],
              options = {
                  title: 'Simple Filter',
                  searchClickedCallback: sendToServer,
                  filterParameters: [
                      {type: 'text', attributeName: 'subject_id', name: 'Object ID', placeholder: 'placeholder text here'},
                      {type: 'date-range', attributeName: 'date_range', name: 'Date Range'},
                      {type: 'single', attributeName: 'productName',name: 'Product', options: productOptions},
                      {type: 'multi', attributeName: 'deviceName',name: 'Manufacturer', options: devicesOptions},
                  ]
              };

      $('#filter').bootstrapFilter(options);

  </script>

</html>
```

# Usage

## Configurable Options
* title: 'Default Filter Title'
* maxElementsInMultiBox: 3
* dateFormat: 'DD-MM-YYYY'
* selectBoxHeight: 180
* borderColor: '#ddd'
* showSearchButton: true
* showBorders: true
* globalPadding: '33px'
* showShiftSelectMessage: true

## filter Parameters
* name - any name you want to display
* value - any name your saver will identify
* relatedTo - The field will cause this parameter to filter itself in relation to another filter
for example:
Filter 2 Option1 -> Filter 1 Option1
Filter 2 Option2 -> Filter 1 Option2

**Selecting Filter 1 Option1 will REMOVE Option2 from Filter2**


# Dependencies

* Jquery
* Bootstrap 3 
* daterangepicker js 
* moment js
* improvely (css only)


# Demo
http://ohadpartuck.github.io/filter_demo/

# Licence
DWYWWI (Do Whatever You Want With It).

# Love it?
compliments here - ohadpartuck@gmail.com

# Changes Log
## V0.1.8
adding a big feature. Saved filters will be shown on the url. Using the History.js libary. 

## V0.1.5
adding feature - enable shift + multi select to checkboxes.

## V0.1.2
* added auto focus on the search input on open select modal.

## V0.1.1
* Added a clear button for the date range.
* Added a search box for screening filter options.


