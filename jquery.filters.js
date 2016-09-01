(function ( $ ) {

    var textType = 'text',
        defaultParameterName = 'No Name Defined',
        dateRange = 'date-range',
        dateRangeName = 'daterange',
        dateTimeFormat = 'DD-MM-YYYY',
        multiCheckBoxes = 'multi',
        rawObject = 'raw',
        single = 'single',
        empty = 'empty',
        showSingleFilterStatus = 'show-single',
        backofficeFiltersUrlPrefix = 'bf_',
        realNameAttribute = 'real-name-attribute',
        title;

    $.bootstrapFilter = {
        filterModal: {}
    };


    var filterModal = {
        that: null,
        global: {},
        filters: {},
        selectedFilterParameters: {},  //each item here is like {attributeName: 'examID', attributeHumaneName: 'exam ID', values: [{name: 'exam_id', value: '1234234'}]}
        searchClickedCallback: undefined, // a function to be executed after we click search
        // a data structure to hold the same data as filterParameters but in a key value way ,
        // used in url decrypt.
        filterParametersByKeyValue: undefined,
    };

    $.fn.bootstrapFilter = function(options) {

        // first thing, make sure we have all of our dependencies
        libraryDependenciesValidations();

        // Defaults Values
        var settings = $.extend({
            title: 'Default Filter Title',
            maxElementsInMultiBox: 3,
            dateFormat: dateTimeFormat,
            selectBoxHeight: 180,
            borderColor: '#ddd',
            showSearchButton: true,
            showBorders: true,
            globalPadding: '33px',
            showShiftSelectMessage: true,
            searchButtonText: 'Search',
            timeOffsetInHours: 0,
            encodeInUrl: 'value',  //can be 'value' / 'name'
        }, options);

        filterModal.that = this;
        filterModal.settings = settings;
        filterModal.searchClickedCallback = settings.searchClickedCallback;
        filterModal.decryptField = settings.encodeInUrl == 'value' ? 'name': 'value';

        decryptUrlIntoSelectedFilters();
        this.html(buildHtml(settings)).hide().fadeIn();
        renderDateRangeIfNeeded();
        bindFilterClicks();
        populateModal();
        exposeFilterModal();
        // representation of the selected filters in the url
        // TODO - condition this with user preference
        embodySelectedFiltersInUrl();

        return this;
    };

    $.fn.renderFilter = function(){
        filterModal.that.bootstrapFilter(filterModal.settings);
    };

    function exposeFilterModal(){
        $.bootstrapFilter.filterModal = filterModal;
    }

    /////////////// html rendering here  ////////////////////
    function buildHtml(settings){

        var selectedFiltersHtml,
            filterInternalHtml,
            searchButton = '',
            selectedFilters;

        // External Style
        filterModal.that.css({ display: 'inline-block', float: 'left',  "border-radius": '5px'});
        if (filterModal.settings.showBorders){
            filterModal.that.css({border: '1px solid ' + filterModal.settings.borderColor })
        }
        filterModal.that.css({padding: filterModal.settings.globalPadding});
        filterModal.that.addClass('col-md-12');
        filterModal.that.addClass('filter-main');

        //building the selected filters html
        selectedFiltersHtml = buildSelectedFiltersHtml();
        selectedFilters =  '<div id="selected-filters" class="row" style="padding-bottom: 15px; margin-bottom: 15px;">'+selectedFiltersHtml+'</div>';

        //building the filters html
        filterInternalHtml = buildFiltersHtml();

        if (filterModal.settings.showSearchButton) {
            searchButton = '<div class="clearfix"></div>' +
                '<div class="row" style="float: right; margin-top: 20px;">' +
                '<button id="filter-search-button" style="padding: 10px 112px" class="btn btn-lg btn-block btn-success">'+filterModal.settings.searchButtonText+'</button>' +
                '</div> ';
        }

        title = '<legend>'+ settings.title+'</legend>';

        return '<div class="row"><i id="show-hide-filter" class="fa fa-chevron-up show-hide-filter-js" style="float: right;"></i></div>' +
            '<fieldset id="bootstrap-filter">' +
            selectedFilters +
            '<div id="filters-and-button">' +
            filterInternalHtml +
            searchButton +
            '</div>' +
            '</fieldset>'
    }

    function buildSingleFilterHtml(parameter, index){
        if (!buildFilterValidations(parameter)){
            return
        }

        var name = parameter.name || defaultParameterName,
            filterTitleHtml = '<div data-attribute="'+ parameter.attributeName+'" class="title" style="">'+ name +' </div>',
            specificHtml,
            backButton = '',
            height = showOnlyOneFilter(filterModal.status) ? 'auto' : filterModal.settings.selectBoxHeight + 'px';

        if (entirePageFilter(index)){
            backButton = '<div class="row"><a class="back-button-js" style="float: left; margin-left: 20px; margin-bottom: 8px;">Back</a></div>'
        }

        switch(parameter.type) {
            case textType:
                specificHtml = renderTextInput(parameter, name);
                break;
            case dateRange:
                specificHtml = renderDateRange(parameter);
                break;
            case multiCheckBoxes:
                specificHtml = renderMultiSelect(parameter, name);
                break;
            case single:
                specificHtml = renderSingleSelect(parameter, name);
                break;
            case empty:
                specificHtml = '';
                filterTitleHtml = '';
                break;
            default:
                specificHtml = '';
                break;
        }

        return '<div class="select-parameter-box '+ parameter.type+ ' " style="border: 1px solid '+filterModal.settings.borderColor+'; height: '+ height + '; padding: 20px; width: 100%; float: left;">' +
            backButton +
            filterTitleHtml +
            '<div class="group-surround">' +
            specificHtml +
            '</div>' +
            '</div>'
    }

    function renderTextInput(parameter, name){
        var value = '';
        if (filterModal.selectedFilterParameters[parameter.attributeName]){
            value = filterModal.selectedFilterParameters[parameter.attributeName].values[0].value
        }

        return '<input style="margin: 5px 0" class="form-control text-input-js" value="'+value+'" placeholder="'+ (parameter.placeholder || name) + '">';
    }

    function renderDateRange(parameter){

        var value = '';
        if (filterModal.selectedFilterParameters[parameter.attributeName]){
            value = filterModal.selectedFilterParameters[parameter.attributeName].values[0].value
        }

        return '<div id="daterange" style="float: left; margin: 5px 0;" class="selectbox active">'  +
            '<input type="text" data-time-picker="true" value="'+value+'" name="'+dateRangeName+'" class="filters-date-range-picker">' +
            '</div>';
    }

    function renderMultiSelect(parameter, name){
        return renderGenericSelect(parameter, name);
    }

    function renderSingleSelect(parameter, name){
        return renderGenericSelect(parameter, name)
    }


    function renderGenericSelect(parameter, name){
        var html,
            checkBoxesHtml = '',
            showMoreButton = '',
            relatedTo,
            showMoreModelName = calcShowMoreModelName(name),
            filteredOptions = [],
            maxElementsToShow = filterModal.settings.maxElementsInMultiBox ;

        //filtering out by date
        if (filterModal.startTime || filterModal.endTime) {
            filteredOptions = filterOptionsByDateRange(parameter.options);
        }else{
            filteredOptions = parameter.options;
        }

        // filtering out by relatedTo, if related To selected.
        // for example, not showing BMW option if filter ASIA was selected
        filteredOptions = filterOutSelectedRelatedTo(filteredOptions);

        $.each(filteredOptions, function(index, filterParameter){
            var display = 'block';
            if (index >  maxElementsToShow - 1 && !(filterParameter.checked)){
                display = 'none';
                showMoreButton = '<a data-toggle="modal" data-target="#'+showMoreModelName+'" class="btn btn-default btn-xs show-more-js">Multi Select .. </a>';
            }

            //in case this filter is connected to other filters
            relatedTo = relateToRender(filterParameter);
            // todo render relatedTo in the html to be coded in the url later

            checkBoxesHtml += '<div class="checkbox" style="display: '+ display + '">' +
                '<a class="single-filter-js"  data-attribute="'+filterParameter.value+'" ' +
                realNameAttribute+'="'+filterParameter.name+'">'+
                filterParameter.name+ relatedTo+'</a></div>';
        });
        checkBoxesHtml += '<div class="clearfix"> </div>';

        html = '<div class="form-group"> ' + checkBoxesHtml + showMoreButton +  '</div>';

        //rendering a show more popup if needed
        if ('' != showMoreButton){
            html += showMoreHiddenPopUpHtml(name, showMoreModelName, parameter, filteredOptions);
        }

        return html;
    }

    function renderDateRangeIfNeeded(){
        var dateRangeElement = $('input[name="'+dateRangeName+'"]'),
            s = filterModal.settings;
        if (dateRangeElement.length >0 ) {
            function cb(start, end) {
                $('input[name="' + dateRangeName + '"]').html(start.format(filterModal.settings.dateFormat) + ' - ' + end.format(filterModal.settings.dateFormat));
            }

            cb(moment().subtract(29, 'days'), moment().add(1, 'days'));

            dateRangeElement.daterangepicker({
                format: filterModal.settings.dateFormat,
                ranges: {
                    'Today': [moment().startOf('day'), moment().endOf('day')],
                    'Last 5 minutes': [moment().subtract(s.timeOffsetInHours, 'hour').subtract(5, 'minutes'), moment().endOf('day')],
                    'Last 15 minutes': [moment().subtract(s.timeOffsetInHours, 'hour').subtract(15, 'minutes'), moment().endOf('day')],
                    'Last 1 hour': [moment().subtract(s.timeOffsetInHours, 'hour').subtract(1, 'hour'), moment().endOf('day')],
                    'Last 3 hour': [moment().subtract(s.timeOffsetInHours, 'hour').subtract(3, 'hour'), moment().endOf('day')],
                    'Last 1 day': [moment().subtract(1, 'day'), moment().endOf('day')],
                    'Last 7 Days': [moment().subtract(6, 'days'), moment().endOf('day')],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment().endOf('day')],
                    'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
                    'This Month': [moment().startOf('month'), moment().endOf('month')],
                    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                    'Last 3 Months': [moment().subtract(3, 'month').startOf('month'), moment().add(10, 'minutes')],
                }, locale: {cancelLabel: 'Clear'}


            }, cb);
        }

    }


    /////////////// internal html methods  ////////////////////

    //should not render filter if is already selected
    function shouldNotRenderParameter(parameter){
        if ($.inArray(parameter.type, [dateRange, textType]) > -1){
            return false
        }

        return undefined != filterModal.selectedFilterParameters[parameter.attributeName];
    }

    function buildSelectedFiltersHtml(){
        var html = '',
            humanParameterName,
            showMoreModelName,
            selectedValue,
            parameter,
            filteredOptions;

        // TODO - from url to data modal or from data modal to url
        // in other words - url params + data modal selected filters should be in both url and filter
        populateSelectedFiltersFromDefaultValues();

        $.each(filterModal.selectedFilterParameters, function(serverName, selectedParameter){
            humanParameterName = selectedParameter.attributeHumaneName;
            showMoreModelName = calcShowMoreModelName(selectedParameter.attributeHumaneName);
            selectedValue = (1 < selectedParameter.values.length) ? '(' + selectedParameter.values.length + ')' : selectedParameter.values[0]['name'];

            parameter = filterModal.filters[serverName];
            // errors on date range
            if (parameter) {

                html += '<div class="selectbox pull-left active" data-attribute="'+ serverName +'" ' +  'type-attribute="' + selectedParameter.type +  '"' +
                    'style="padding: 10px; margin-right: 10px; margin-bottom: 10px; ;border: 1px solid '+filterModal.settings.borderColor+'">'  +
                    '<a data-toggle="modal" data-target="#'+showMoreModelName+'">'+ humanParameterName + ': '+  selectedValue +'</a>' +
                    '<button type="button" class="close remove-filter" aria-label="Close" style="padding: 0 10px 0 15px; line-height: 0.75">' +
                    '<span aria-hidden="true">&times;</span></button>' +
                    '</div>';

                filteredOptions = filterOptionsByDateAndRelatedToFilters(parameter);
                html += showMoreHiddenPopUpHtml(parameter.name, showMoreModelName, parameter, filteredOptions);
            }
        });

        return html
    }

    function buildFiltersHtml(){
        var filterInternalHtml = '<div class="row" style="border: 1px solid '+filterModal.settings.borderColor+'">',
            additionalFilterHtml = '',
            realIndex = 0,
            tempHtml,
            showMoreModelName,
            filteredOptions;

        // first 6 filters
        $.each(filterModal.settings.filterParameters, function(index, parameter){
            tempHtml = buildSingleParameterHtml(realIndex, parameter);

            if ('' != tempHtml){
                realIndex += 1
            }

            filterInternalHtml += tempHtml;
        });

        // fill other boxes with nothing if too little parameters passed
        if (6 > realIndex){

            for (var i = 0; i < (6 - realIndex); i++) {
                filterInternalHtml += buildSingleParameterHtml(i + realIndex , {name: '', type: empty, attributeName: 'bla'})
            }
        }

        //additional filters

        realIndex = 0;
        $.each(filterModal.settings.filterParameters, function(index, parameter){
            if (!shouldNotRenderParameter(parameter)){
                realIndex += 1
            }
            if (realIndex > 6 ){
                if (shouldNotRenderParameter(parameter)){
                    additionalFilterHtml += '';
                }else{
                    showMoreModelName = calcShowMoreModelName(parameter.name);
                    filteredOptions = filterOptionsByDateAndRelatedToFilters(parameter);
                    tempHtml = showMoreHiddenPopUpHtml(parameter.name, showMoreModelName, parameter, filteredOptions);
                    additionalFilterHtml += '<div class="checkbox"><a data-toggle="modal" data-target="#'+
                        showMoreModelName+'" data-attribute="'+
                        parameter.attributeName+'">'+parameter.name+'</a>' +
                        '</div>' +
                        tempHtml;
                }
            }
        });
        if (7 > realIndex){
            additionalFilterHtml += '<h4>No additional filters</h4>'
        }

        filterInternalHtml +='<div class="select-parameter-box  " style="border: 1px solid '+filterModal.settings.borderColor+'; height: '+filterModal.settings.selectBoxHeight *2+'px; padding: 20px; width: 25%; float: left;">' +
            'Additional Filters' +
            '<div class="group-surround">' +
            additionalFilterHtml +
            '</div>' +
            '</div>' ;

        filterInternalHtml += '</div>';

        return filterInternalHtml;
    }

    function buildSingleParameterHtml(index, parameter){
        var filterInternalHtml = '',
            width;
        if (shouldNotRenderParameter(parameter)){
            return '';
        }
        if (index > 5){
            return '';
        }


        if (isEven(index)){
            if (entirePageFilter(index)){
                width = 100;  // the filter will span on the entire page
            }else{
                width = 25;
            }
            filterInternalHtml += '<div style="width:'+width+'%; float: left">'
        }
        if (!isEven(index)){
            filterInternalHtml += '<div class="clearfix"></div>'
        }
        filterInternalHtml += buildSingleFilterHtml(parameter, index);


        if (!isEven(index)){
            filterInternalHtml += '</div>'
        }

        return filterInternalHtml
    }

    function entirePageFilter(index){
        return index < 0
    }

    function showMoreHiddenPopUpHtml(parameterName, showMoreModelName, parameter, filteredOptions){
        return '<div id="'+showMoreModelName+'" class="modal fade in bootstrap-modal-js">'+
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '<div data-attribute="'+ parameter.attributeName+'" class="title" style="visibility: hidden;">'+ parameterName +' </div>' +
            '<h4 class="modal-title">'+parameterName+'</h4>' +
            '</div>' +
            '<div class="modal-body">' +
            htmlForParameterOptions(parameter, filteredOptions) +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-default multi-popup-close-js" data-dismiss="modal">Close</button>' +
            '<button type="button" class="btn btn-primary multi-popup-save-changes-js">Apply Changes</button>' +
            '</div>' +
            '</div><!-- /.modal-content -->'+
            '</div><!-- /.modal-dialog -->' +
            '</div><!-- /.modal -->';

    }

    function htmlForParameterOptions(parameter, filteredOptions) {
        var checkBoxesHtml = '',
            selectedFilter,
            finalOptions = (undefined == filteredOptions) ? parameter.options : filteredOptions,
            selectedValues = [],
            relatedTo,
            filterInputBox = '',
            shiftSelectMultiMessage = '';

        selectedFilter = filterModal.selectedFilterParameters[parameter.attributeName];
        if (selectedFilter){
            selectedValues = $.map(selectedFilter.values, function(data){ return data.value.toString()});
        }


        if (finalOptions.length > 10) {
            filterInputBox = '<input class="search-filters search-filters-js" placeholder="search">';
            if (filterModal.settings.showShiftSelectMessage) {
                shiftSelectMultiMessage = '<p class="gray">shift and click to select multi checkboxes</p>';
            }

        }

        $.each(finalOptions, function (index, filterParameter) {
            var checked = '';
            if (existsInArray(filterParameter.value.toString(), selectedValues)){
                checked = 'checked = "checked"'
            }

            //in case this filter is connected to other filters
            relatedTo = relateToRender(filterParameter);

            checkBoxesHtml += '<div class="checkbox"><label>' +
                '<input type="checkbox" '+ checked + ' value="' + filterParameter.value + '" ' +
                realNameAttribute+'="' + filterParameter.name + '">' +
                filterParameter.name + relatedTo +
                '</label></div>';
        });

        return filterInputBox + shiftSelectMultiMessage + checkBoxesHtml;
    }

    function relateToRender(filterParameter){
        var relatedTo = '';
        if (filterParameter.relatedTo){
            relatedTo += ' (';
            $.each(filterParameter.relatedTo, function(paramServerName, parameterData){
                relatedTo += parameterData.name + ', '
            });
            //chop off last 2 chars - ", "
            relatedTo = relatedTo.slice(0,-2);
            relatedTo += ')';

        }
        return relatedTo;
    }

    function buildFilterValidations(parameter){
        if (undefined == parameter.attributeName){
            alert(parameter.name || defaultParameterName + ' does not have an attributeName parameter defined. its a must');
            return false
        }

        return true
    }

    function showOnlyOneFilter(status){
        return (showSingleFilterStatus == status)
    }

    /////////////// internal html methods end  ////////////////////

    /////////////// html rendering end  ////////////////////

    /////////////// Events Binding here  ////////////////////
    function bindFilterClicks(){
        bindSearchClicked();
        bindMultiPopup();
        bindSingleClick();
        bindRemoveSelectedFilter();
        bindMultiPopupClose();
        bindMultiSelectFromMain();
        bindChangeDate();
        bindInputChange();
        bindExpandCollapse();
        bindBackButton();
        bindEnterButton();
        bindSearchFilterType();
        bindHiddenPopupsOpened();
        bindSelectedFiltersToUrl();
    }

    // using history.js https://github.com/browserstate/history.js
    // to embody the selected filters in the url
    // This in order to allow saving filters and sending them to other users
    function bindSelectedFiltersToUrl(){

        History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
            //var State = History.getState(); // Note: We are using History.getState() instead of event.state
        });

    }

    // TODO - add jquery , bootstrap, moment
    function libraryDependenciesValidations(){
        if (typeof History.Adapter === 'undefined') {
            throw 'History.js (https://github.com/browserstate/history.js) is a dependency for backoffice filters. ' +
            'See the docs (http://ohadpartuck.github.io/filter_demo) as to how to install it.'
        }
    }


    // looking for all the popups and attaching event listener
    function bindHiddenPopupsOpened(){
        $('.bootstrap-modal-js').each(function(i, modal){
            // enable the user to type directly in the search input
            // without having to select it using the mouse
            $('#'+modal.id).on('shown.bs.modal', function (e) {
                $(this).find('.search-filters-js').focus()
            });

            //enable shift + select multi checkboxes
            $('#'+modal.id + ' input[type="checkbox"]').shiftSelectable()
        });
    }


    //in popup. filter out not relevant options while the user types in
    function bindSearchFilterType(){
        $('.search-filters-js').keyup(function(){
            var text = $(this).val().toLowerCase(),
                selectBox = $(this).closest('.modal-body');

            selectBox.find('label').each(function(i, label){
                if (text == ''){
                    $(label).closest('.checkbox').show()
                }else {
                    if ($(label).text().toLowerCase().indexOf(text) >= 0){
                        $(label).closest('.checkbox').show()
                    } else {
                        $(label).closest('.checkbox').hide()
                    }
                }
            })
        })
    }

    function bindInputChange(){
        $('.text-input-js').keyup(function(){
            addInputSelectedToDataModal($(this).closest('.select-parameter-box'))
        })
    }

    function bindMultiPopup(){
        $('.multi-popup-save-changes-js').on('click', function () {
            var popup = $(this).closest('.modal'),
                title = $(popup.find('.modal-title')[0]).text(),
                result;

            result = addMultiSelectedToDataModal(popup);

            if (0 < result.checked.length) {
                popup.modal('hide');
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();

                setTimeout(function(){
                    //refresh the filter
                    filterModal.that.renderFilter()
                }, 200);
            }
        })
    }

    function bindMultiPopupClose(){
        $('.multi-popup-close-js').on('click', function () {
            var popup = $(this).closest('.modal');

            //close the popup
            popup.modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();

        })
    }

    function bindMultiSelectFromMain(){

        $('.multi-apply-main-js').on('click', function () {
            var selectBox = $(this).closest('.select-parameter-box');

            addMultiSelectedToDataModal(selectBox);

            resetShowSingleFilterIfNeeded();

            filterModal.that.renderFilter();

        })
    }

    function findCheckedOptions(parentElement){
        var checked = [],
            unchecked = [],
            data;

        $(parentElement).find('input').each(function (_, element) {
            data = buildElementData(element, multiCheckBoxes);
            if ($(element).is(":checked")){
                $.extend(data, {checked: true});
                checked.push(data);
            }else{
                unchecked.push(data)
            }
        });

        return {checked: checked, unchecked: unchecked}
    }

    function buildElementData(element, type){
        var name, value, realName;
        switch (type){
            case multiCheckBoxes:
                name = $(element).closest('label').text();
                realName = $(element).closest('input').attr(realNameAttribute);
                value = $(element).val();
                break;
            case single:
                name = $(element).text();
                value = $(element).attr('data-attribute');
                realName = $(element).attr(realNameAttribute);
                break;
            case rawObject:
                name = element.name;
                value = element.value;
                // TODO - fix here
                realName = element.name;
                break;
            default:
                $(element).text();
                break;
        }

        return {name: name, value: value, realName: realName };
    }


    function bindSearchClicked() {

        $('#filter-search-button').on('click', function(){
            searchClickedCallback()
        });
    }

    function searchClickedCallback(){
        var selectedFilters;

        selectedFilters = collectSelectedFilters();

        if (undefined == filterModal.searchClickedCallback){
            alert('no search callback is defined. send one via the searchClickedCallback parameter');
        }

        filterModal.searchClickedCallback(selectedFilters)
    }

    function collectSelectedFilters(){
        var tempValues = [],
            DoNotSaveThisInTheSelectedFiltered = {};

        //collect all the selected filters if still haven't selected
        //collect uncollected multi, single
        $.each([multiCheckBoxes], function(_, inputType) {
            $('.select-parameter-box.' + inputType).each(function (_, selectBox) {
                addMultiSelectedToDataModal(selectBox, true);
            });
        });

        $.each([textType, dateRange], function(_, inputType) {
            $('.select-parameter-box.' + inputType).each(function (_, selectBox) {

                //TODO replace this with genericCollect
                var serverParameterName = getAttributeBackendName(selectBox),
                    humanParameterName = getAttributeHumanName(selectBox),
                    searchFor = getSearchParameter(inputType);

                //TODO - find a better way to collect the data
                $(selectBox).find(searchFor).each(function (_, inputElement) {
                    var value = $(inputElement).val();
                    if (value) {
                        tempValues.push({value: value}); // TODO pass also name here
                    }
                });
                if (0 < tempValues.length) {
                    DoNotSaveThisInTheSelectedFiltered[serverParameterName] = {attributeHumaneName: humanParameterName, values: tempValues};
                    tempValues = [];
                }
            });
        });

        return $.extend(DoNotSaveThisInTheSelectedFiltered, filterModal.selectedFilterParameters)
    }


    function genericCollect(selectBox, inputType) {
        var tempValues = [],
            DoNotSaveThisInTheSelectedFiltered = {};

        var serverParameterName = getAttributeBackendName(selectBox),
            humanParameterName = getAttributeHumanName(selectBox),
            searchFor = getSearchParameter(inputType);

        //TODO - find a better way to collect the data
        $(selectBox).find(searchFor).each(function (_, inputElement) {
            var value = $(inputElement).val();
            if (value) {
                tempValues.push({value: value}); // TODO pass also name here
            }
        });
        if (0 < tempValues.length) {
            DoNotSaveThisInTheSelectedFiltered[serverParameterName] = {attributeHumaneName: humanParameterName, values: tempValues};
        }

        return {value: DoNotSaveThisInTheSelectedFiltered[serverParameterName], serverParameterName: serverParameterName}
    }


    function addInputSelectedToDataModal(selectBox){
        var data = genericCollect(selectBox, textType);
        modifySelectedFilterData(data.serverParameterName, data.value, textType);
    }

    function bindSingleClick(){
        $('.single-filter-js').on('click', function(){
            var selectBox = $(this).closest('.select-parameter-box');

            addSingleSelectedToDataModal(this, selectBox);

            resetShowSingleFilterIfNeeded();

            filterModal.that.renderFilter()
        });
    }

    function bindRemoveSelectedFilter(){
        $('.remove-filter').on('click', function(){
            var serverFilterName = $(this).parent('.selectbox').attr('data-attribute'),
                type = getAttributeType($(this).parent('.selectbox'));

            modifySelectedFilterData(serverFilterName, undefined, type);

            //re render the filter
            filterModal.that.renderFilter();
        });
    }

    function bindChangeDate(){
        $('.applyBtn').on('click',function(){

            filterModal.startTime = $('input[name=daterangepicker_start]').last().val();
            filterModal.endTime = $('input[name=daterangepicker_end]').last().val();

            //re render with dates filter
            filterModal.that.renderFilter();
        });

        $('#daterange').on('apply.daterangepicker', function(ev, picker) {
            addDateSelectedToDataModal($(this).closest('.select-parameter-box'));
        }).on('cancel.daterangepicker', function(ev, picker) {
            $('#daterange input').val('');
            addDateSelectedToDataModal($(this).closest('.select-parameter-box'));
        });

    }

    function bindExpandCollapse(){
        $('.show-hide-filter-js').on('click', function(){
            $('#filters-and-button').toggle('slow');
            $(this).toggleClass("fa-chevron-down");
        })
    }

    function bindBackButton(){
        $('.back-button-js').on('click', function () {
            resetShowSingleFilterIfNeeded();

            filterModal.that.renderFilter();
        })
    }

    function bindEnterButton(){
        $(document).keypress(function( event ) {
            if (event.which == 13) {  //13 means return was pressed
                event.preventDefault();
                searchClickedCallback()
            }
        });
    }

    function getSearchParameter(inputType){
        switch(inputType) {
            case textType:
            case dateRange:
                return 'input';
                break;
            case multiCheckBoxes:
            case single:
                return 'input:checked';
                break;
        }

    }

    function filterOptionsByDateAndRelatedToFilters(parameter){
        var filteredOptions;

        if (filterModal.startTime || filterModal.endTime) {
            filteredOptions = filterOptionsByDateRange(parameter.options);
        }else{
            filteredOptions = parameter.options;
        }

        // filtering out by relatedTo, if related To selected.
        // for example, not showing BMW option if filter ASIA was selected
        filteredOptions = filterOutSelectedRelatedTo(filteredOptions);

        return filteredOptions;
    }

    function filterOptionsByDateRange(options){

        return $.map(options, function(option){
            if (undefined == option.date){ //parameter doesn't have a date to compare to
                return option
            }else{
                if (moment(filterModal.startTime, filterModal.settings.dateFormat) <= moment(option.date, filterModal.settings.dateFormat) &&
                    moment(filterModal.endTime, filterModal.settings.dateFormat) >= moment(option.date, filterModal.settings.dateFormat)){
                    return option
                }
            }
        });
    }

    function filterOutSelectedRelatedTo(options){
        var result = [],
            relevantSelectedFilter;

        if (options == undefined){
            return result;
        }

        $.each(options, function(_, option){
            if (option.relatedTo){
                $.each(option.relatedTo, function(relatedToName, relatedToValue){
                    relevantSelectedFilter = getRelevantSelectedFilter(relatedToName);
                    if (relevantSelectedFilter) {
                        if (existsInSelectedFilter(relevantSelectedFilter.values, relatedToValue.value)) {
                            result.push(option)
                        }
                    }else{
                        result.push(option)
                    }
                })
            }else{
                result.push(option)
            }
        });

        return result;
    }

    function getRelevantSelectedFilter(relatedToName){
        var relevantFilter = undefined;

        $.each(filterModal.selectedFilterParameters, function(filterName, filter){
            if (relatedToName == filterName){
                relevantFilter = filter;
                return true;
            }
        });
        return relevantFilter;
    }

    function existsInSelectedFilter(selectFilterValues, relatedToValue){
        var exists = false,
            selectedValues;

        selectedValues = selectFilterValues.map(function(element) { return element.value });
        if (existsInArray(relatedToValue, selectedValues)){
            exists = true;
            return true;
        }

        return exists;
    }


    function modifySelectedFilterData(key, value, type){
        var removed = false;
        if (value) {
            value['type'] = type;
            filterModal.selectedFilterParameters[key] = value;
        }else{
            removed = true;
            delete filterModal.selectedFilterParameters[key];
        }

        // currently on single and multi are supported,
        // TODO - add date range and text input
        if (existsInArray(type, [single, multiCheckBoxes])) {
            embodySelectedFiltersInUrl(removed)
        }

    }

    function decryptUrlIntoSelectedFilters(){
        var urlExistingData = getUrlVars(),
            data = UrlParametersFromUrlData(urlExistingData),
            values,
            selectedValue,
            selectedData,
            dataToPush,
            name, tempValue, tempRelatedTo;

        //will init only of needed
        initFilterParametersByKeyValue();

        // TODO make sure that the url data is already included
        // in the selected filters data
        $.each(data.relatedData, function(key, value){
            key = removeFiltersPrefix(key);
            if (!filterModal.selectedFilterParameters[key]) {
                values = value.split(',');
                selectedData = filterModal.filterParametersByKeyValue[key];
                filterModal.selectedFilterParameters[key] = {values: [],
                    attributeHumaneName: selectedData.name,
                    type: selectedData.type};
                $.each(values, function (_, selectedFilterValue) {
                    selectedFilterValue = decodeURIComponent(selectedFilterValue);
                    // possible bug here
                    selectedFilterValue = selectedFilterValue.replace("/", "");
                    if (selectedData.options[selectedFilterValue]) {

                        selectedValue = selectedData.options[selectedFilterValue][filterModal.decryptField];
                        tempRelatedTo = relateToRender(selectedData.options[selectedFilterValue]);
                        if (filterModal.decryptField == 'value'){
                            name = selectedFilterValue + tempRelatedTo;
                            tempValue = selectedValue;
                        }else{
                            name = selectedValue + tempRelatedTo;
                            tempValue = selectedFilterValue;
                        }

                        dataToPush = buildElementData({name: name, value: tempValue}, rawObject);
                        filterModal.selectedFilterParameters[key].values.push(dataToPush)
                    }
                });
            }
        })

    }


    function removeFiltersPrefix(fullString){
        return fullString.substr(backofficeFiltersUrlPrefix.length);
    }


    function initFilterParametersByKeyValue(){
        var key;
        if (!filterModal.filterParametersByKeyValue){
            filterModal.filterParametersByKeyValue =  {};
            $.each(filterModal.settings.filterParameters, function(_, data){
                filterModal.filterParametersByKeyValue[data.attributeName] = $.extend({}, data);
                filterModal.filterParametersByKeyValue[data.attributeName].options = {};
                if (data.options) {
                    $.each(data.options, function (_, optionData) {
                        // todo maybe change optionData.name to optionData.value ,
                        // name can repeat , value - less likely

                        key = optionData[filterModal.settings.encodeInUrl];
                        filterModal.filterParametersByKeyValue[data.attributeName].options[key] = optionData;
                    })
                }
            });
        }
    }


    // representation of the selected filters in the url
    // backoffice filters in the url will be prefixed with "bf"
    function embodySelectedFiltersInUrl(removed){

        var urlExistingData,
            selectedFiltersData = {},
            data,
            url = '',
            notRelatedUrlData,
            relatedUrlData;

        /// gather input
        urlExistingData = getUrlVars();
        urlExistingData = selectedFiltersFormat(urlExistingData);
        data = UrlParametersFromUrlData(urlExistingData);

        /// Actual Work
        // if the user removed a selected filter, we need to run over the
        // url with the selected filters, else with need to unify url with
        if (removed){
            $.extend(selectedFiltersData, filterModal.selectedFilterParameters)
        }else{
            $.extend(selectedFiltersData, filterModal.selectedFilterParameters, urlExistingData)
        }

        relatedUrlData = filterModal.selectedFilterParameters;
        notRelatedUrlData = data['notRelatedData'];

        url += dataObjectToUrl(notRelatedUrlData);
        if (url != '') { url += '&'}
        url += dataObjectToUrl(relatedUrlData, true);
        url = '?'+ url;
        History.pushState({}, document.title, url);

        /// No deliver results, not needed
    }

    // from key => value to to key => {values: [{name: value}, ...]
    function selectedFiltersFormat(keyValueData, prePopulatedData){
        var selectedFiltersFormatData = prePopulatedData || {},
            selectedValue;

        $.each(keyValueData, function(key, values){
            if (!$.isArray(values)) {
                values = [values]
            }

            selectedFiltersFormatData[key] = {values: []};
            $.each(values, function(_, value){
                selectedValue = buildElementData({name: value, value: 'bla', realName: value}, rawObject);
                selectedFiltersFormatData[key].values.push(selectedValue)
            });

        });

        return selectedFiltersFormatData;
    }

    function UrlParametersFromUrlData(urlExistingData){
        var relatedData = {}, notRelatedData = {};

        $.each(urlExistingData, function(key, value){
            if (!key.startsWith(backofficeFiltersUrlPrefix)) {
                notRelatedData[key] = value;
            }else{
                relatedData[key] = value;
            }
        });

        return {relatedData: relatedData, notRelatedData: notRelatedData};
    }


    function dataObjectToUrl(data, backofficeFiltersPrefix){
        var url = '',
            prefix = backofficeFiltersPrefix ? backofficeFiltersUrlPrefix : '';

        $.each(data, function(key, keyData){
            url +=  prefix + key + '=';
            $.each(keyData.values, function(_, value){
                // filterModal.settings.encodeInUrl or 'realValue'
                url += value[filterModal.settings.encodeInUrl] + ','
            });
            url = url.slice(0, -1); // cur the last ,
            url += '&'

        });

        if (!$.isEmptyObject(data) > 0) {
            url = url.slice(0, -1);  // cur the last '&'
        }

        return url
    }

    function addSingleSelectedToDataModal(selectedItem ,selectBox){
        var serverParameterName = getAttributeBackendName(selectBox),
            humanParameterName = getAttributeHumanName(selectBox),
            data = buildElementData(selectedItem, single);

        modifySelectedFilterData(serverParameterName, {attributeHumaneName: humanParameterName, values: [data]}, single)
    }

    function addMultiSelectedToDataModal(selectBox, dontAlert){
        var serverParameterName = getAttributeBackendName(selectBox),
            humanParameterName = getAttributeHumanName(selectBox),
            optionsResult;

        optionsResult = findCheckedOptions(selectBox);

        if (0 ==  optionsResult.checked.length){
            if (undefined == dontAlert || false == dontAlert) {
                alert('please select at least one option.');
            }
            return {checked: []};
        }

        modifySelectedFilterData(serverParameterName,
            { attributeHumaneName: humanParameterName, values: optionsResult.checked},
            multiCheckBoxes);

        return {checked: optionsResult.checked}
    }

    function addDateSelectedToDataModal(selectBox){
        var data = genericCollect(selectBox, dateRange);

        modifySelectedFilterData(data.serverParameterName, data.value, dateRange);
    }

    function resetShowSingleFilterIfNeeded(){
        filterModal.status = null;
        filterModal.singleFilterToShow = null;
    }

    function getAttributeBackendName(selectBox){
        return $(selectBox).find('.title').attr('data-attribute')
    }


    function getAttributeHumanName(selectBox){
        return $(selectBox).find('.title').last().text()
    }

    function getAttributeType(selectBox){
        return $(selectBox).attr('type-attribute')
    }

    function populateModal(){
        filterModal.selectedFiltersObj = filterModal.that.find('#selected-filters');
    }

    function populateSelectedFiltersFromDefaultValues(){
        if (!filterModal.initiated ) {

            $.each(filterModal.settings.filterParameters, function (_, parameter) {
                if (-1 < $.inArray(parameter.type, [single, multiCheckBoxes])) {
                    filterModal.filters[parameter.attributeName] = parameter;
                }

                var serverParameterName = parameter.attributeName,
                    humanParameterName = parameter.name,
                    selected = [];
                if (parameter.options) {
                    $.each(parameter.options, function (_, parameterOption) {
                        if (parameterOption.selected) {
                            var data = buildElementData(parameterOption, rawObject);
                            selected.push(data);
                        }
                    });

                    if (0 < selected.length) {
                        modifySelectedFilterData(serverParameterName, {
                                attributeHumaneName: humanParameterName,
                                values: selected
                            },
                            parameter.type);
                    }
                }
            });
        }

        filterModal.initiated = true;

    }

    function isEven(number){
        return 0 == number%2
    }

    function calcShowMoreModelName(name){
        return name.replace(/\s+/g, '') + 'ShowMoreModal'
    }

    function existsInArray(item, array){
        return (-1 < $.inArray(item, array))
    }

    function getUrlVars(){
        var vars = {}, hash, key, value;
        // in case no parameters
        if (window.location.href.indexOf('?') == -1){
            return vars
        }

        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        if (hashes[0]== ''){
            return vars
        }

        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            key = hash[0];
            value = hash[1];
            //vars.push(hash[0]);
            //%5B%5D is [] in url params
            if (stringContains(key, '[]') || stringContains(key, '%5B%5D') || vars[key] != undefined) { //array
                if (!$.isArray(vars[key])) {
                    vars[key] = [vars[key]];
                }
                vars[key].push(value)
            }else{
                vars[key] = value
            }

        }
        return vars;
    }

    function stringContains(string, subString){
        return (string.indexOf(subString) > -1);
    }

    $.fn.shiftSelectable = function() {
        var lastChecked,
            $boxes = this;

        $boxes.click(function(event) {
            if(!lastChecked) {
                lastChecked = this;
                return;
            }

            if(event.shiftKey) {
                var start = $boxes.index(this);
                var end = $boxes.index(lastChecked);

                $.each($boxes.slice(Math.min(start,end), Math.max(start,end)+ 1), function(){
                    if ($(this).is(":visible")) {
                        $(this).prop('checked', lastChecked.checked);
                    }
                })
            }

            lastChecked = this;
        });
    };

    /////////////// Events Binding end  ////////////////////

}( jQuery ));