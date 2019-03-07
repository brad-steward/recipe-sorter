function splitList(data, property) {
  var r = [];
  for (var i in data) {
    if (data[i][property] != null) {
      var subset = data[i][property].split(', ');
      for(var j in subset) {
        var contains = false;
        for (var k in r) {
          if(r[k].name.toLowerCase() === subset[j].toLowerCase()) contains = true;
        }
        if (!contains) r.push({id: r.length, name: capitalize(subset[j])});
      }
    }
  }
  return r;
}
function capitalize(string) {
  var split = string.split(' ');
  for (var i in split) {
    var ss = split[i];
    ss = ss.substr(0, 1).toUpperCase() + ss.substr(1).toLowerCase();
    split[i] = ss;
  }
  string = split.join(' ');
  return string;
}
function updateFormData(data) {
  var keys = Object.keys(data[0]);
  for (var i in keys) {
    if (typeof data[0][keys[i]] == 'string')
      window.formData[keys[i]] = splitList(data, keys[i]);
  }
  retrieveFilters();
}
function addListeners() {
  $('#filter').on({
    click: function() {
      window.formData.methodValue = $('#method').val();
      window.formData.ethnicityValue = $('#ethnicity').val();
      window.formData.mealValue = $('#meal').val();
      window.formData.calorieLimit = $('#calories').val();
      window.formData.isGlutenFree = $('#glutenFree').prop('checked');
      storeFilters();
      loadData();
    }
  });
}
function applyValues() {
  $('#method').val(window.formData.methodValue);
  $('#ethnicity').val(window.formData.ethnicityValue);
  $('#meal').val(window.formData.mealValue);
  if (window.formData.calorieLimit) 
    if(window.formData.calorieLimit !== "")
      $('#calories').val(window.formData.calorieLimit);
  $('#glutenFree').prop('checked', window.formData.isGlutenFree);
}
function loadData() {
  $('#items').html('Loading...');
  $('#randomFAB').hide();
  $.getJSON('https://api.sheety.co/140bb7d0-0b81-4c8a-9fcb-123a9e7cf840', function(data) {
    updateFormData(data);
    data = mapAndFilter(data);
    window.dataLength = data.length;
    if(data.length > 0)
      $('#items').html(window.template(data));
    else
      $('#items').html('No recipes available under these conditions');
    $('#fields').html(window.formTemplate(window.formData));
    addListeners();
    applyValues();
    $('#randomFAB').show();
  });
}
function mapAndFilter(data) {
  data = data.map(mapCalories);
  data = data.map(mapGlutenFree);
  if (window.formData.calorieLimit) {
    if(window.formData.calorieLimit !== "") {
      data = data.map(mapServings);
      data = data.filter(filterServings);
    }
  }
  if (window.formData.isGlutenFree) {
    data = data.filter(glutenFreeFilter);
  }
  var keys = Object.keys(window.formData);
  for (var i in keys) {
    if (keys[i].includes('Value')) if(parseInt(window.formData[keys[i]]) !== -1) data = data.filter(selectFilter(keys[i].replace('Value', ''))); 
  }
  return data.sort(nameSort);
}

function nameSort(a,b) {
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
  return 0;
}
function mapCalories(item, index) {
  if (item.totalCalories != null && item.numberOfServings != null) {
    item.caloriesPerServing = item.totalCalories/item.numberOfServings;
  } else if (item.totalCalories != null && item.caloriesPerServing != null) {
    item.numberOfServings = Math.floor(item.totalCalories/item.caloriesPerServing);
  } else if (item.numberOfServings != null && item.caloriesPerServing != null) {
    item.totalCalories = item.numberOfServings * item.caloriesPerServing;
  } else {
    item.totalCalories = 1;
    item.numberOfServings = 1;
    item.caloriesPerServing = 1;
  }
  return item;
}
function mapGlutenFree(item, index) {
  if (typeof item.glutenFree == 'string')
    item.glutenFree = item.glutenFree == "Yes" ? true : false
  return item;
}
function mapServings(item, index) {
  item.numOfServings = (Math.floor(parseInt(window.formData.calorieLimit) / item.caloriesPerServing));
  item.totalMealCalories = parseInt(item.numOfServings) * parseInt(item.caloriesPerServing);
  return item;
}
function filterServings(item, index) {
  return item.numOfServings > 0;
}
function selectFilter(property) {
  return function(item, index) {
    var propertyValue = property + 'Value';
    return item[property].includes(window.formData[property][window.formData[propertyValue]].name);
  }
}
function glutenFreeFilter(item, index) {
  return item.glutenFree || item.glutenFree === "Yes" || item.glutenFreeOptions != null;
}
function init() {
  window.template = window.hb.compile($('#item-template').html());
  window.formTemplate = window.hb.compile($('#form-template').html());
  setInterval(loadData, 1800000);
}
function random() {
  var randomR = Math.floor(Math.random() * window.dataLength);
  var recipeId = '#recipe-' + randomR;
  $('.selectedRecipe').removeClass('selectedRecipe');
  $(recipeId).addClass('selectedRecipe');
  window.scrollTo({ top: $(recipeId).offset().top, behavior: 'smooth' });
}
function openForm() {
  $('.iframeContainer').show();
}
function closeForm() {
  $('.iframeContainer').hide();
}
function storeFilters() {
  var keys = Object.keys(window.formData);
  for (var i of keys) {
    var key = i;
    if (key.includes('Value') || key.includes('is') || key.includes('Limit') || key.includes('search')) {
      var value = window.formData[key];
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      localStorage.setItem(key,value);
    }
  }
}
function retrieveFilters() {
  var keys = Object.keys(window.formData);
  for (var i of keys) {
    var key = i;
    if (localStorage.getItem(key)) {
      var value = localStorage.getItem(key);
      window.formData[key] = JSON.parse(value);
    }
  }
}
