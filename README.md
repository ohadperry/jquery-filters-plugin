# Filters
Jquery + bootstrap filters rending out of the box for backoffice use

![Sample](https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/master/images/simple_filter.png)

# Quick Start
```
<!DOCTYPE html>
<html>
<head>
  <script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
  <script src="http://momentjs.com/downloads/moment.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
  <script src="https://cdn.rawgit.com/dangrossman/bootstrap-daterangepicker/master/daterangepicker.js"></script>
  <script src="https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/v0.0.2/jquery.filters.js" type="text/javascript"></script>
  
  <link rel="stylesheet" media="all" href="https://raw.githubusercontent.com/dangrossman/bootstrap-daterangepicker/master/daterangepicker-bs3.css">
  <link rel="stylesheet" media="all" href="https://cdn.rawgit.com/ohadpartuck/jquery-filters-plugin/master/css/improvely.css">
  <link rel="stylesheet" media="all" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css">

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
* title: 'Default Filter Title',
* maxElementsInMultiBox: 3
* dateFormat: 'DD-MM-YYYY'
* selectBoxHeight: 180,

# Dependencies

* Jquery
* Bootstrap 3 
* daterangepicker js 
* moment js
* improvely (css only)


# Demo
http://ohadpartuck.github.io/filter_demo/

# Licence
Free.

# Love it?
compliments here - ohadpartuck@gmail.com

