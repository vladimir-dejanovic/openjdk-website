'use strict';

/* eslint-disable no-unused-vars */
var platforms = [];
var variants = [];
var lookup = {};
var i = 0;
var variant = getQueryByName('variant');
var variantSelector = document.getElementById('variant-selector');
var platformSelector = document.getElementById('platform-selector');

function setLookup() {
  // FUNCTIONS FOR GETTING PLATFORM DATA
  // allows us to use, for example, 'lookup["MAC"];'
  for (i = 0; i < platforms.length; i++) {
    lookup[platforms[i].searchableName] = platforms[i];
  }
}

function getVariantObject(variant) {
  var variantObject = '';
  variants.forEach(function (eachVariant) {
    if (eachVariant.searchableName === variant) {
      variantObject = eachVariant;
    }
  });
  return variantObject;
}

// gets the 'searchableName' when you pass in the full filename.
// If the filename does not match a known platform, returns false. (E.g. if a new or incorrect file appears in a repo)
function getSearchableName(filename) {
  var platform = null;
  platforms.forEach(function (eachPlatform) {
    if (filename.indexOf(eachPlatform.searchableName) >= 0) {
      platform = eachPlatform.searchableName;
    }
  });
  if (platform) {
    return platform;
  } else {
    return null;
  }
}

// set path to logos
var logoPath = './dist/assets/';

// gets the OFFICIAL NAME when you pass in 'searchableName'
function getOfficialName(searchableName) {
  return lookup[searchableName].officialName;
}

function getPlatformOrder(searchableName) {
  var index = platforms.findIndex(function (platform) {
    return platform.searchableName == searchableName;
  });
  return index;
}

function orderPlatforms(inputArray) {
  function compareOrder(thisAsset, nextAsset) {
    if (thisAsset.thisPlatformOrder < nextAsset.thisPlatformOrder) return -1;
    if (thisAsset.thisPlatformOrder > nextAsset.thisPlatformOrder) return 1;
    return 0;
  }
  var orderedArray = inputArray.sort(compareOrder);
  return orderedArray;
}

// gets the BINARY EXTENSION when you pass in 'searchableName'
function getBinaryExt(searchableName) {
  return lookup[searchableName].binaryExtension;
}

// gets the INSTALLER EXTENSION when you pass in 'searchableName'
function getInstallerExt(searchableName) {
  return lookup[searchableName].installerExtension;
}

// gets the LOGO WITH PATH when you pass in 'searchableName'
function getLogo(searchableName) {
  return logoPath + lookup[searchableName].logo;
}

// gets the INSTALLATION COMMAND when you pass in 'searchableName'
function getInstallCommand(searchableName) {
  return lookup[searchableName].installCommand;
}

// gets the CHECKSUM COMMAND when you pass in 'searchableName'
function getChecksumCommand(searchableName) {
  return lookup[searchableName].checksumCommand;
}

// gets the PATH COMMAND when you pass in 'searchableName'
function getPathCommand(searchableName) {
  return lookup[searchableName].pathCommand;
}

// set value for loading dots on every page
var loading = document.getElementById('loading');

// set value for error container on every page
var errorContainer = document.getElementById('error-container');

// set variable names for menu elements
var menuOpen = document.getElementById('menu-button');
var menuClose = document.getElementById('menu-close');
var menu = document.getElementById('menu-container');

menuOpen.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideOutLeft(?!\S)/g, ' slideInLeft'); // slide in animation
  menu.className = menu.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated'); // removes initial hidden property, activates animations
};

menuClose.onclick = function () {
  menu.className = menu.className.replace(/(?:^|\s)slideInLeft(?!\S)/g, ' slideOutLeft'); // slide out animation
};

// this function returns an object containing all information about the user's OS (from the 'platforms' array)
function detectOS() {
  // if the platform detection library's output matches the 'osDetectionString' of any platform object in the 'platforms' array...
  // ...set the variable 'matchedOS' as the whole object. Else, 'matchedOS' will be null.
  var matchedOS = null;
  platforms.forEach(function (eachPlatform) {
    var thisPlatformMatchingString = eachPlatform.osDetectionString.toUpperCase();
    /* eslint-disable */
    var platformFamily = platform.os.family.toUpperCase(); // platform.os.family is dependent on 'platform.js', loaded by index.html (injected in index.handlebars)
    /* eslint-enable */
    if (thisPlatformMatchingString.indexOf(platformFamily) >= 0) {
      // if the detected 'platform family' string appears in the osDetectionString value of a platform...
      matchedOS = eachPlatform;
    }
  });

  if (matchedOS) {
    return matchedOS;
  } else {
    return null;
  }
}

// when using this function, pass in the name of the repo (options: releases, nightly)
function loadJSON(repo, filename, callback) {
  var url = 'https://raw.githubusercontent.com/AdoptOpenJDK/' + repo + '/master/' + filename + '.json'; // the URL of the JSON built in the website back-end
  if (repo === 'adoptopenjdk.net') {
    url = filename;
  }
  var xobj = new XMLHttpRequest();
  xobj.open('GET', url, true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == '200') {
      // if the status is 'ok', run the callback function that has been passed in.
      callback(xobj.responseText);
    } else if (xobj.status != '200' && // if the status is NOT 'ok', remove the loading dots, and display an error:
    xobj.status != '0') {
      // for IE a cross domain request has status 0, we're going to execute this block fist, than the above as well.
      if (filename !== 'jck') {
        if (xobj.status == '404') {
          var url_string = window.location.href;
          var url = new URL(url_string);
          var variant = url.searchParams.get('variant');
          document.getElementById('error-container').innerHTML = '<p>There are no releases available for ' + variant + '. Please check our <a href=nightly.html?variant=' + variant + ' target=\'blank\'>Nightly Builds</a>.</p>';
        } else {
          document.getElementById('error-container').innerHTML = '<p>Error... there\'s a problem fetching the releases. Please see the <a href=\'https://github.com/AdoptOpenJDK/openjdk-' + repo + '/releases\' target=\'blank\'>releases list on GitHub</a>.</p>';
        }
        loading.innerHTML = '';
      } else {
        loading.innerHTML = '';
        callback(null);
      }
    }
  };
  xobj.send(null);
}

function loadPlatformsThenData(callback) {
  loadJSON('adoptopenjdk.net', './dist/json/config.json', function (response) {
    var configJson = JSON.parse(response);

    if (typeof configJson !== 'undefined') {
      // if there are releases...
      platforms = configJson.platforms;
      variants = configJson.variants;
      setVariantSelector();
      setLookup();
      callback();
    } else {
      // report an error
      errorContainer.innerHTML = '<p>Error... there\'s a problem fetching the releases. Please see the <a href=\'https://github.com/AdoptOpenJDK/openjdk-releases/releases\' target=\'blank\'>releases list on GitHub</a>.</p>';
      loading.innerHTML = ''; // remove the loading dots
    }
  });
}

// build the menu twisties
var submenus = document.getElementById('menu-content').getElementsByClassName('submenu');

for (i = 0; i < submenus.length; i++) {
  var twisty = document.createElement('span');
  var twistyContent = document.createTextNode('>');
  twisty.appendChild(twistyContent);
  twisty.className = 'twisty';

  var thisLine = submenus[i].getElementsByTagName('a')[0];
  thisLine.appendChild(twisty);

  thisLine.onclick = function () {
    this.parentNode.classList.toggle('open');
  };
}

function setTickLink() {
  var ticks = document.getElementsByClassName('tick');
  for (i = 0; i < ticks.length; i++) {
    ticks[i].addEventListener('click', function (event) {
      var win = window.open('https://en.wikipedia.org/wiki/Technology_Compatibility_Kit', '_blank');
      if (win) {
        win.focus();
      } else {
        alert('New tab blocked - please allow popups.');
      }
      event.preventDefault();
    });
  }
}

function setUrlQuery(name, newValue) {
  if (window.location.search.indexOf(name) >= 0) {
    var currentValue = getQueryByName(name);
    window.location.search = window.location.search.replace(currentValue, newValue);
  } else {
    window.location.search += name + '=' + newValue;
  }
}

function getQueryByName(name) {
  var url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function persistUrlQuery() {
  var links = Array.apply(null, document.getElementsByTagName('a'));
  links.forEach(function (eachLink) {
    if (eachLink.href.indexOf(window.location.hostname) >= 0) {
      eachLink.href = eachLink.href + window.location.search;
    }
  });
}

function setVariantSelector() {
  if (variantSelector) {
    if (variantSelector.options.length === 0) {
      variants.forEach(function (eachVariant) {
        var op = new Option();
        op.value = eachVariant.searchableName;
        op.text = eachVariant.officialName;
        op.description = eachVariant.description;
        op.descriptionLink = eachVariant.descriptionLink;
        variantSelector.options.add(op);
        if (!variant && eachVariant.default) {
          variant = op.value;
        }
      });
    }

    if (!variant) {
      variant = variants[0].searchableName;
    }

    variantSelector.value = variant;

    if (variantSelector.value === '') {
      var op = new Option();
      op.value = 'unknown';
      op.text = 'Select a variant';
      variantSelector.options.add(op);
      variantSelector.value = 'unknown';
      errorContainer.innerHTML = '<p>Error: no such variant. Please select a valid variant from the drop-down list.</p>';
    }

    variantSelector.onchange = function () {
      setUrlQuery('variant', variantSelector.value);
    };
  }
}

function copyClipboard(element) {
  var $temp = $('<input>');
  $('body').append($temp);
  $temp.val($(element).text()).select();
  document.execCommand('copy');
  $temp.remove();
  alert('Copied to clipboard');
}

function highlightCode() {
  hljs.initHighlightingOnLoad();
}
'use strict';

var ARCHIVEDATA;

// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onArchiveLoad() {
  /* eslint-enable no-unused-vars */
  ARCHIVEDATA = new Object();
  populateArchive(); // populate the Archive page
}

// ARCHIVE PAGE FUNCTIONS

function populateArchive() {
  loadPlatformsThenData(function () {

    // TODO - the commented-out repoName variable below should be passed into loadJSON below as the first argument, replacing openjdk-releases.
    // This can only be done after the repository name is updated from 'openjdk-releases' to 'openjdk8-releases'.

    var repoName = variant + '-releases';

    loadJSON(repoName, 'releases', function (response) {
      function checkIfProduction(x) {
        // used by the array filter method below.
        return x.prerelease === false && x.assets[0];
      }

      // Step 1: create a JSON from the XmlHttpRequest response
      // Step 2: filter out all releases from this JSON that are marked as 'pre-release' in GitHub.
      var releasesJson = JSON.parse(response).filter(checkIfProduction);

      // if there are releases prior to the 'latest' one (i.e. archived releases)...
      if (typeof releasesJson[0] !== 'undefined') {
        loadJSON(repoName, 'jck', function (response_jck) {
          var jckJSON = {};
          if (response_jck !== null) {
            jckJSON = JSON.parse(response_jck);
          }
          buildArchiveHTML(releasesJson, jckJSON);
        });
      } else {
        // if there are no releases (beyond the latest one)...
        // report an error, remove the loading dots
        loading.innerHTML = '';
        errorContainer.innerHTML = '<p>There are no archived releases yet! See the <a href=\'./releases.html\'>Latest build</a> page.</p>';
      }
    });
  });
}

function buildArchiveHTML(releasesJson, jckJSON) {
  var RELEASEARRAY = [];

  // for each release...
  releasesJson.forEach(function (eachRelease) {
    var RELEASEOBJECT = new Object();
    var ASSETARRAY = [];

    // set values for this release, ready to inject into HTML
    var publishedAt = eachRelease.published_at;
    RELEASEOBJECT.thisReleaseName = eachRelease.name;
    RELEASEOBJECT.thisReleaseDay = moment(publishedAt).format('D');
    RELEASEOBJECT.thisReleaseMonth = moment(publishedAt).format('MMMM');
    RELEASEOBJECT.thisReleaseYear = moment(publishedAt).format('YYYY');
    RELEASEOBJECT.thisGitLink = 'https://github.com/AdoptOpenJDK/' + variant + '-releases/releases/tag/' + RELEASEOBJECT.thisReleaseName;

    // create an array of the details for each asset that is attached to this release
    var assetArray = [];
    eachRelease.assets.forEach(function (each) {
      assetArray.push(each);
    });

    // populate 'platformTableRows' with one row per binary for this release...
    assetArray.forEach(function (eachAsset) {
      var ASSETOBJECT = new Object();
      var nameOfFile = eachAsset.name;
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase

      ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

      // firstly, check if the platform name is recognised...
      if (ASSETOBJECT.thisPlatform) {

        // if the filename contains both the platform name and the matching INSTALLER extension, add the relevant info to the asset object
        ASSETOBJECT.thisInstallerExtension = getInstallerExt(ASSETOBJECT.thisPlatform);

        ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform); // get the file extension associated with this platform

        if (uppercaseFilename.indexOf(ASSETOBJECT.thisInstallerExtension.toUpperCase()) >= 0) {
          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                ASSETARRAY.pop();
              }
            });
          }
          ASSETOBJECT.thisPlatformExists = true;
          ASSETOBJECT.thisInstallerExists = true;
          RELEASEOBJECT.installersExist = true;
          ASSETOBJECT.thisInstallerLink = eachAsset.browser_download_url;
          ASSETOBJECT.thisInstallerSize = Math.floor(eachAsset.size / 1024 / 1024);
          ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
          ASSETOBJECT.thisBinaryExists = true;
          RELEASEOBJECT.binariesExist = true;
          ASSETOBJECT.thisBinaryLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisInstallerExtension, ASSETOBJECT.thisBinaryExtension);
          ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.size / 1024 / 1024);
          ASSETOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisInstallerExtension, '.sha256.txt');
          ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
          if (Object.keys(jckJSON).length == 0) {
            ASSETOBJECT.thisVerified = false;
          } else {
            if (jckJSON[eachRelease.name] && jckJSON[eachRelease.name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
              ASSETOBJECT.thisVerified = true;
            } else {
              ASSETOBJECT.thisVerified = false;
            }
          }
        }

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)

        if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
          var installerExist = false;
          if (ASSETARRAY.length > 0) {
            ASSETARRAY.forEach(function (asset) {
              if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
                installerExist = true;
              }
            });
          }
          if (!installerExist) {
            // set values ready to be injected into the HTML
            ASSETOBJECT.thisPlatformExists = true;
            ASSETOBJECT.thisBinaryExists = true;
            RELEASEOBJECT.binariesExist = true;
            ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
            ASSETOBJECT.thisBinaryLink = eachAsset.browser_download_url;
            ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.size / 1024 / 1024);
            ASSETOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
            ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
            if (Object.keys(jckJSON).length == 0) {
              ASSETOBJECT.thisVerified = false;
            } else {
              if (jckJSON[eachRelease.name] && jckJSON[eachRelease.name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
                ASSETOBJECT.thisVerified = true;
              } else {
                ASSETOBJECT.thisVerified = false;
              }
            }
          }
        }

        if (ASSETOBJECT.thisPlatformExists === true) {
          ASSETARRAY.push(ASSETOBJECT);
        }
      }
    });

    ASSETARRAY = orderPlatforms(ASSETARRAY);

    RELEASEOBJECT.thisPlatformAssets = ASSETARRAY;
    RELEASEARRAY.push(RELEASEOBJECT);
  });
  console.log(RELEASEARRAY);
  ARCHIVEDATA.htmlTemplate = RELEASEARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('archive-table-body').innerHTML = template(ARCHIVEDATA);

  setPagination();
  setTickLink();

  loading.innerHTML = ''; // remove the loading dots

  // show the archive list and filter box, with fade-in animation
  var archiveList = document.getElementById('archive-list');
  archiveList.className = archiveList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function setPagination() {
  var container = $('#pagination-container');
  var archiveRows = document.getElementById('archive-table-body').getElementsByClassName('release-row');
  var paginationArrayHTML = [];
  for (i = 0; i < archiveRows.length; i++) {
    paginationArrayHTML.push(archiveRows[i].outerHTML);
  }

  var options = {
    dataSource: paginationArrayHTML,
    pageSize: 5,
    callback: function callback(response) {

      var dataHtml = '';

      $.each(response, function (index, item) {
        dataHtml += item;
      });

      $('#archive-table-body').html(dataHtml);
    }
  };

  container.pagination(options);

  if (document.getElementById('pagination-container').getElementsByTagName('li').length <= 3) {
    document.getElementById('pagination-container').classList.add('hide');
  }

  return container;
}
'use strict';

// set variables for all index page HTML elements that will be used by the JS
var dlText = document.getElementById('dl-text');
var dlLatest = document.getElementById('dl-latest');
var dlArchive = document.getElementById('dl-archive');
var dlOther = document.getElementById('dl-other');
var dlIcon = document.getElementById('dl-icon');
var dlIcon2 = document.getElementById('dl-icon-2');
var dlVersionText = document.getElementById('dl-version-text');

// When index page loads, run:
/* eslint-disable no-unused-vars */
function onIndexLoad() {
  setDownloadSection(); // on page load, populate the central download section.
}
/* eslint-enable no-unused-vars */

// INDEX PAGE FUNCTIONS

function setDownloadSection() {
  loadPlatformsThenData(function () {

    var repoName = variant + '-releases';

    loadJSON(repoName, 'latest_release', function (response) {
      var releasesJson = JSON.parse(response);

      if (typeof releasesJson !== 'undefined') {
        // if there are releases...
        buildHomepageHTML(releasesJson);
      } else {
        // report an error
        errorContainer.innerHTML = '<p>Error... no releases have been found!</p>';
        loading.innerHTML = ''; // remove the loading dots
      }
    });
  });
}

function buildHomepageHTML(releasesJson) {
  // set the download button's version number to the latest build
  dlVersionText.innerHTML = releasesJson.tag_name;

  // create an array of the details for each binary that is attached to a release
  var assetArray = [];
  // create a new array that contains each 'asset' (binary) from the latest build:
  releasesJson.assets.forEach(function (each) {
    assetArray.push(each);
  });

  var OS = detectOS(); // set a variable as an object containing all information about the user's OS (from the global.js 'platforms' array)
  var matchingFile = null;

  // if the OS has been detected...
  if (OS) {
    assetArray.forEach(function (eachAsset) {
      // iterate through the assets attached to this release
      var nameOfFile = eachAsset.name;
      var uppercaseFilename = nameOfFile.toUpperCase();
      var thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. X64_MAC or X64_LINUX.
      var uppercaseOSname = null;
      // firstly, check if a valid searchableName has been returned (i.e. the platform is recognised)...
      if (thisPlatform) {

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        var thisBinaryExtension = getBinaryExt(thisPlatform); // get the binary extension associated with this platform
        var thisInstallerExtension = getInstallerExt(thisPlatform); // get the installer extension associated with this platform
        if (matchingFile == null) {
          if (uppercaseFilename.indexOf(thisInstallerExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();

            // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)
            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          } else if (uppercaseFilename.indexOf(thisBinaryExtension.toUpperCase()) >= 0) {
            uppercaseOSname = OS.searchableName.toUpperCase();

            // thirdly, check if the user's OS searchableName string matches part of this binary's name (e.g. ...X64_LINUX...)
            if (uppercaseFilename.indexOf(uppercaseOSname) >= 0) {
              matchingFile = eachAsset; // set the matchingFile variable to the object containing this binary
            }
          }
        }
      }
    });
  }

  // if there IS a matching binary for the user's OS...
  if (matchingFile) {
    dlLatest.href = matchingFile.browser_download_url; // set the main download button's link to be the binary's download url
    dlText.innerHTML = 'Download for <var platform-name>' + OS.officialName + '</var>'; // set the text to be OS-specific, using the full OS name.
    var thisBinarySize = Math.floor(matchingFile.size / 1024 / 1024);
    dlVersionText.innerHTML += ' - ' + thisBinarySize + ' MB';
    if (matchingFile.jck === true) {
      document.getElementById('jck-approved-tick').classList.remove('hide');
      setTickLink();
    }
  }
  // if there is NOT a matching binary for the user's OS...
  else {
      dlOther.classList.add('hide'); // hide the 'Other platforms' button
      dlIcon.classList.add('hide'); // hide the download icon on the main button, to make it look less like you're going to get a download immediately
      dlIcon2.classList.remove('hide'); // un-hide an arrow-right icon to show instead
      dlText.innerHTML = 'Downloads'; // change the text to be generic: 'Downloads'.
      dlLatest.href = './releases.html?variant=' + variant; // set the main download button's link to the latest builds page for all platforms.
    }

  // remove the loading dots, and make all buttons visible, with animated fade-in
  loading.classList.add('hide');
  dlLatest.className = dlLatest.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlOther.className = dlOther.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');
  dlArchive.className = dlArchive.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated ');

  dlLatest.onclick = function () {
    document.getElementById('installation-link').className += ' animated pulse infinite transition-bright';
  };

  // animate the main download button shortly after the initial animation has finished.
  setTimeout(function () {
    dlLatest.className = 'dl-button a-button animated pulse';
  }, 1000);
}
'use strict';

var INSTALLDATA;

/* eslint-disable no-unused-vars */
function onInstallationLoad() {
  /* eslint-enable no-unused-vars */

  INSTALLDATA = new Object();
  populateInstallation(); // populate the Latest page
}

function populateInstallation() {
  loadPlatformsThenData(function () {

    var repoName = variant + '-releases';

    loadJSON(repoName, 'latest_release', function (response) {
      var releasesJson = JSON.parse(response);
      if (typeof releasesJson !== 'undefined') {
        // if there are releases...
        buildInstallationHTML(releasesJson);
      } else {
        // report an error
        errorContainer.innerHTML = '<p>Error... no installation information has been found!</p>';
        loading.innerHTML = ''; // remove the loading dots
      }
    });
  });
}

function buildInstallationHTML(releasesJson) {

  // create an array of the details for each asset that is attached to a release
  var assetArray = [];
  releasesJson.assets.forEach(function (each) {
    assetArray.push(each);
  });

  var ASSETARRAY = [];

  // for each asset attached to this release, check if it's a valid binary, then add a download block for it...
  assetArray.forEach(function (eachAsset) {
    var ASSETOBJECT = new Object();
    var nameOfFile = eachAsset.name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
    ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

    // check if the platform name is recognised...
    if (ASSETOBJECT.thisPlatform) {

      ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);

      // if the filename contains both the platform name and the matching BINARY extension, add the relevant info to the asset object
      ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform);
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
        ASSETOBJECT.thisPlatformExists = true;
        ASSETOBJECT.thisBinaryLink = eachAsset.browser_download_url;
        ASSETOBJECT.thisBinaryFilename = eachAsset.name;
        ASSETOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
        ASSETOBJECT.thisChecksumFilename = eachAsset.name.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
        ASSETOBJECT.thisUnzipCommand = getInstallCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        ASSETOBJECT.thisChecksumCommand = getChecksumCommand(ASSETOBJECT.thisPlatform).replace('FILENAME', ASSETOBJECT.thisBinaryFilename);
        ASSETOBJECT.thisPathCommand = getPathCommand(ASSETOBJECT.thisPlatform).replace('DIRNAME', releasesJson.name);
      }

      if (ASSETOBJECT.thisPlatformExists === true) {
        ASSETARRAY.push(ASSETOBJECT);
      }
    }
  });

  ASSETARRAY = orderPlatforms(ASSETARRAY);

  INSTALLDATA.htmlTemplate = ASSETARRAY;

  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  document.getElementById('installation-template').innerHTML = template(INSTALLDATA);

  setInstallationPlatformSelector(ASSETARRAY);
  window.onhashchange = displayInstallPlatform;

  loading.innerHTML = ''; // remove the loading dots
  var installationContainer = document.getElementById('installation-container');
  installationContainer.className = installationContainer.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
}

function displayInstallPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInstallation = document.getElementById('installation-container-' + platformHash);
  unselectInstallPlatform();

  if (thisPlatformInstallation) {
    platformSelector.value = platformHash;
    thisPlatformInstallation.classList.remove('hide');
  } else {
    var currentValues = [];
    var platformSelectorOptions = Array.apply(null, platformSelector.options);
    platformSelectorOptions.forEach(function (eachOption) {
      currentValues.push(eachOption.value);
    });
    if (currentValues.indexOf('unknown') === -1) {
      var op = new Option();
      op.value = 'unknown';
      op.text = 'Select a platform';
      platformSelector.options.add(op, 0);
    }
    platformSelector.value = 'unknown';
  }
}

function unselectInstallPlatform() {
  var platformInstallationDivs = document.getElementById('installation-container').getElementsByClassName('installation-single-platform');

  for (i = 0; i < platformInstallationDivs.length; i++) {
    platformInstallationDivs[i].classList.add('hide');
  }
}

function setInstallationPlatformSelector(thisReleasePlatforms) {

  if (platformSelector) {
    if (platformSelector.options.length === 0) {
      thisReleasePlatforms.forEach(function (eachPlatform) {
        var op = new Option();
        op.value = eachPlatform.thisPlatform;
        op.text = eachPlatform.thisOfficialName;
        platformSelector.options.add(op);
      });
    }

    var OS = detectOS();
    if (OS && window.location.hash.length < 1) {
      platformSelector.value = OS.searchableName;
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    } else {
      displayInstallPlatform();
    }

    platformSelector.onchange = function () {
      window.location.hash = platformSelector.value.toLowerCase();
      displayInstallPlatform();
    };
  }
}
'use strict';

// set variables for HTML elements
var NIGHTLYDATA;

var tableHead = document.getElementById('table-head');
var tableContainer = document.getElementById('nightly-list');
var nightlyList = document.getElementById('nightly-table');
var searchError = document.getElementById('search-error');
var numberpicker = document.getElementById('numberpicker');
var datepicker = document.getElementById('datepicker');

// When nightly page loads, run:
/* eslint-disable no-unused-vars */
function onNightlyLoad() {
  /* eslint-enable no-unused-vars */
  NIGHTLYDATA = new Object();

  setDatePicker();
  populateNightly(); // run the function to populate the table on the Nightly page.

  numberpicker.onchange = function () {
    setTableRange();
  };
  datepicker.onchange = function () {
    setTableRange();
  };
}

// NIGHTLY PAGE FUNCTIONS

function setDatePicker() {
  $(datepicker).datepicker();
  var today = moment().format('MM/DD/YYYY');
  datepicker.value = today;
}

function populateNightly() {
  loadPlatformsThenData(function () {

    var repoName = variant + '-nightly';

    loadJSON(repoName, 'nightly', function (response) {

      function checkIfProduction(x) {
        // used by the array filter method below.
        return x.prerelease === false && x.assets[0];
      }

      // Step 1: create a JSON from the XmlHttpRequest response
      // Step 2: filter out all releases from this JSON that are marked as 'pre-release' in GitHub.
      var releasesJson = JSON.parse(response).filter(checkIfProduction);

      // if there are releases...
      if (typeof releasesJson[0] !== 'undefined') {
        buildNightlyHTML(releasesJson);
      } else {
        // if there are no releases...
        // report an error
        errorContainer.innerHTML = '<p>Error... no releases have been found!</p>';
        loading.innerHTML = ''; // remove the loading dots
      }
    });
  });
}

function buildNightlyHTML(releasesJson) {
  tableHead.innerHTML = '<tr id=\'table-header\'><th>Release</th><th>Date</th><th>Platform</th><th>Binary</th><th>Checksum</th></tr>';
  var NIGHTLYARRAY = [];

  // for each release...
  releasesJson.forEach(function (eachRelease) {

    // create an array of the details for each binary that is attached to a release
    var assetArray = [];
    eachRelease.assets.forEach(function (each) {
      assetArray.push(each);
    });

    // build rows with the array of binaries...
    assetArray.forEach(function (eachAsset) {
      // for each file attached to this release...
      var NIGHTLYOBJECT = new Object();
      var nameOfFile = eachAsset.name;
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the file uppercase
      NIGHTLYOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

      // firstly, check if the platform name is recognised...
      if (NIGHTLYOBJECT.thisPlatform) {

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        NIGHTLYOBJECT.thisBinaryExtension = getBinaryExt(NIGHTLYOBJECT.thisPlatform); // get the file extension associated with this platform
        if (uppercaseFilename.indexOf(NIGHTLYOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {

          // set values ready to be injected into the HTML
          var publishedAt = eachRelease.published_at;
          NIGHTLYOBJECT.thisReleaseName = eachRelease.name.slice(0, 12);
          NIGHTLYOBJECT.thisReleaseDay = moment(publishedAt).format('D');
          NIGHTLYOBJECT.thisReleaseMonth = moment(publishedAt).format('MMMM');
          NIGHTLYOBJECT.thisReleaseYear = moment(publishedAt).format('YYYY');
          NIGHTLYOBJECT.thisGitLink = 'https://github.com/AdoptOpenJDK/' + variant + '-nightly/releases/tag/' + eachRelease.name;
          NIGHTLYOBJECT.thisOfficialName = getOfficialName(NIGHTLYOBJECT.thisPlatform);
          NIGHTLYOBJECT.thisBinaryLink = eachAsset.browser_download_url;
          NIGHTLYOBJECT.thisBinarySize = Math.floor(eachAsset.size / 1024 / 1024);
          NIGHTLYOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(NIGHTLYOBJECT.thisBinaryExtension, '.sha256.txt');

          NIGHTLYARRAY.push(NIGHTLYOBJECT);
        }
      }
    });
  });

  NIGHTLYDATA.htmlTemplate = NIGHTLYARRAY;
  var template = Handlebars.compile(document.getElementById('template').innerHTML);
  nightlyList.innerHTML = template(NIGHTLYDATA);

  setSearchLogic();

  loading.innerHTML = ''; // remove the loading dots

  // show the table, with animated fade-in
  nightlyList.className = nightlyList.className.replace(/(?:^|\s)hide(?!\S)/g, ' animated fadeIn ');
  setTableRange();

  // if the table has a scroll bar, show text describing how to horizontally scroll
  var scrollText = document.getElementById('scroll-text');
  var tableDisplayWidth = document.getElementById('nightly-list').clientWidth;
  var tableScrollWidth = document.getElementById('nightly-list').scrollWidth;
  if (tableDisplayWidth != tableScrollWidth) {
    scrollText.className = scrollText.className.replace(/(?:^|\s)hide(?!\S)/g, '');
  }
}

function setTableRange() {
  var rows = $('#nightly-table tr');
  var selectedDate = moment(datepicker.value, 'MM-DD-YYYY').format();
  var visibleRows = 0;

  for (i = 0; i < rows.length; i++) {
    var thisDate = rows[i].getElementsByClassName('nightly-release-date')[0].innerHTML;
    var thisDateMoment = moment(thisDate, 'D MMMM YYYY').format();
    var isAfter = moment(thisDateMoment).isAfter(selectedDate);
    if (isAfter === true || visibleRows >= numberpicker.value) {
      rows[i].classList.add('hide');
    } else {
      rows[i].classList.remove('hide');
      visibleRows++;
    }
  }

  checkSearchResultsExist();
}

function setSearchLogic() {
  // logic for the realtime search box...
  var $rows = $('#nightly-table tr');
  $('#search').keyup(function () {
    var val = '^(?=.*' + $.trim($(this).val()).split(/\s+/).join(')(?=.*') + ').*$',
        reg = RegExp(val, 'i'),
        text;

    $rows.show().filter(function () {
      text = $(this).text().replace(/\s+/g, ' ');
      return !reg.test(text);
    }).hide();

    checkSearchResultsExist();
  });
}

function checkSearchResultsExist() {
  var numOfVisibleRows = $('#nightly-table').find('tr:visible').length;
  if (numOfVisibleRows == 0) {
    tableContainer.style.visibility = 'hidden';
    searchError.className = '';
  } else {
    tableContainer.style.visibility = '';
    searchError.className = 'hide';
  }
}
'use strict';

var RELEASEDATA;

// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onLatestLoad() {
  /* eslint-enable no-unused-vars */

  RELEASEDATA = new Object();
  populateLatest(); // populate the Latest page
}

// LATEST PAGE FUNCTIONS

function populateLatest() {
  loadPlatformsThenData(function () {

    var repoName = variant + '-releases';

    loadJSON(repoName, 'latest_release', function (response) {
      var releasesJson = JSON.parse(response);
      if (typeof releasesJson !== 'undefined') {
        // if there are releases...
        loadJSON(repoName, 'jck', function (response_jck) {
          var jckJSON = {};
          if (response_jck !== null) {
            jckJSON = JSON.parse(response_jck);
          }
          buildLatestHTML(releasesJson, jckJSON);
        });
      } else {
        // report an error
        errorContainer.innerHTML = '<p>Error... no releases have been found!</p>';
        loading.innerHTML = ''; // remove the loading dots
      }
    });
  });
}

function buildLatestHTML(releasesJson, jckJSON) {

  // populate with description
  var variantObject = getVariantObject(variant);
  if (variantObject.descriptionLink) {
    document.getElementById('description_header').innerHTML = 'What is ' + variantObject.description + '?';
    document.getElementById('description_link').innerHTML = 'Find out here';
    document.getElementById('description_link').href = variantObject.descriptionLink;
  }
  // populate the page with the release's information
  var publishedAt = releasesJson.published_at;
  document.getElementById('latest-build-name').innerHTML = '<var release-name>' + releasesJson.name + '</var>';
  document.getElementById('latest-build-name').href = 'https://github.com/AdoptOpenJDK/' + variant + '-releases/releases/tag/' + releasesJson.name;
  document.getElementById('latest-date').innerHTML = '<var>' + moment(publishedAt).format('D') + '</var> ' + moment(publishedAt).format('MMMM') + ' <var>' + moment(publishedAt).format('YYYY') + '</var>';
  document.getElementById('latest-timestamp').innerHTML = publishedAt.slice(0, 4) + publishedAt.slice(8, 10) + publishedAt.slice(5, 7) + publishedAt.slice(11, 13) + publishedAt.slice(14, 16);

  // create an array of the details for each asset that is attached to a release
  var assetArray = [];

  releasesJson.assets.forEach(function (each) {
    assetArray.push(each);
  });

  var ASSETARRAY = [];
  // for each asset attached to this release, check if it's a valid binary, then add a download block for it...
  assetArray.forEach(function (eachAsset) {
    var ASSETOBJECT = new Object();
    var nameOfFile = eachAsset.name;
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
    ASSETOBJECT.thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

    // check if the platform name is recognised...
    if (ASSETOBJECT.thisPlatform) {
      ASSETOBJECT.thisLogo = getLogo(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisPlatformOrder = getPlatformOrder(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisOfficialName = getOfficialName(ASSETOBJECT.thisPlatform);
      if (Object.keys(jckJSON).length == 0) {
        ASSETOBJECT.thisVerified = false;
      } else {
        if (jckJSON[releasesJson.name] && jckJSON[releasesJson.name].hasOwnProperty(ASSETOBJECT.thisPlatform)) {
          ASSETOBJECT.thisVerified = true;
        } else {
          ASSETOBJECT.thisVerified = false;
        }
      }

      // if the filename contains both the platform name and the matching INSTALLER extension, add the relevant info to the asset object
      ASSETOBJECT.thisInstallerExtension = getInstallerExt(ASSETOBJECT.thisPlatform);
      ASSETOBJECT.thisBinaryExtension = getBinaryExt(ASSETOBJECT.thisPlatform);
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisInstallerExtension.toUpperCase()) >= 0) {
        if (ASSETARRAY.length > 0) {
          ASSETARRAY.forEach(function (asset) {
            if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
              ASSETARRAY.pop();
            }
          });
        }
        ASSETOBJECT.thisPlatformExists = true;
        ASSETOBJECT.thisInstallerExists = true;
        ASSETOBJECT.thisInstallerLink = eachAsset.browser_download_url;
        ASSETOBJECT.thisInstallerSize = Math.floor(eachAsset.size / 1024 / 1024);
        ASSETOBJECT.thisBinaryExists = true;
        ASSETOBJECT.thisBinaryLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisInstallerExtension, ASSETOBJECT.thisBinaryExtension);
        ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.size / 1024 / 1024);
        ASSETOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisInstallerExtension, '.sha256.txt');
      }
      // if the filename contains both the platform name and the matching BINARY extension, add the relevant info to the asset object
      if (uppercaseFilename.indexOf(ASSETOBJECT.thisBinaryExtension.toUpperCase()) >= 0) {
        var installerExist = false;
        if (ASSETARRAY.length > 0) {
          ASSETARRAY.forEach(function (asset) {
            if (asset.thisPlatform === ASSETOBJECT.thisPlatform) {
              installerExist = true;
            }
          });
        }
        if (!installerExist) {
          ASSETOBJECT.thisPlatformExists = true;
          ASSETOBJECT.thisBinaryExists = true;
          ASSETOBJECT.thisBinaryLink = eachAsset.browser_download_url;
          ASSETOBJECT.thisBinarySize = Math.floor(eachAsset.size / 1024 / 1024);
          ASSETOBJECT.thisChecksumLink = eachAsset.browser_download_url.replace(ASSETOBJECT.thisBinaryExtension, '.sha256.txt');
        }
      }

      if (ASSETOBJECT.thisPlatformExists === true) {
        ASSETARRAY.push(ASSETOBJECT);
      }
    }
  });

  ASSETARRAY = orderPlatforms(ASSETARRAY);

  RELEASEDATA.htmlTemplate = ASSETARRAY;
  var templateSelector = Handlebars.compile(document.getElementById('template-selector').innerHTML);
  var templateInfo = Handlebars.compile(document.getElementById('template-info').innerHTML);
  document.getElementById('latest-selector').innerHTML = templateSelector(RELEASEDATA);
  document.getElementById('latest-info').innerHTML = templateInfo(RELEASEDATA);

  setTickLink();

  displayLatestPlatform();
  window.onhashchange = displayLatestPlatform;

  loading.innerHTML = ''; // remove the loading dots

  var latestContainer = document.getElementById('latest-container');
  latestContainer.className = latestContainer.className.replace(/(?:^|\s)invisible(?!\S)/g, ' animated fadeIn '); // make this section visible (invisible by default), with animated fade-in
}

/* eslint-disable no-unused-vars */
function selectLatestPlatform(thisPlatform) {
  /* eslint-enable no-unused-vars */
  window.location.hash = thisPlatform.toLowerCase();
}

function displayLatestPlatform() {
  var platformHash = window.location.hash.substr(1).toUpperCase();
  var thisPlatformInfo = document.getElementById('latest-info-' + platformHash);
  if (thisPlatformInfo) {
    unselectLatestPlatform('keep the hash');
    document.getElementById('latest-selector').classList.add('hide');
    thisPlatformInfo.classList.remove('hide');
  }
}

function unselectLatestPlatform(keephash) {
  if (!keephash) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
  var platformButtons = document.getElementById('latest-selector').getElementsByClassName('latest-asset');
  var platformInfoBoxes = document.getElementById('latest-info').getElementsByClassName('latest-info-container');

  for (i = 0; i < platformButtons.length; i++) {
    platformInfoBoxes[i].classList.add('hide');
  }

  document.getElementById('latest-selector').classList.remove('hide');
}
'use strict';

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}