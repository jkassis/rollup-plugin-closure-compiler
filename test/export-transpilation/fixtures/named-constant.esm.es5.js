var b=b||{};b.scope={};b.arrayIteratorImpl=function(a){var c=0;return function(){return c<a.length?{done:!1,value:a[c++]}:{done:!0}}};b.arrayIterator=function(a){return{next:b.arrayIteratorImpl(a)}};b.ASSUME_ES5=!1;b.ASSUME_NO_NATIVE_MAP=!1;b.ASSUME_NO_NATIVE_SET=!1;b.SIMPLE_FROUND_POLYFILL=!1;b.ISOLATE_POLYFILLS=!1;
b.defineProperty=b.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(a,c,e){if(a==Array.prototype||a==Object.prototype)return a;a[c]=e.value;return a};b.getGlobal=function(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var c=0;c<a.length;++c){var e=a[c];if(e&&e.Math==Math)return e}throw Error("Cannot find global object");};b.global=b.getGlobal(this);
b.IS_SYMBOL_NATIVE="function"===typeof Symbol&&"symbol"===typeof Symbol("x");b.TRUST_ES6_POLYFILLS=!b.ISOLATE_POLYFILLS||b.IS_SYMBOL_NATIVE;b.polyfills={};b.propertyToPolyfillSymbol={};b.POLYFILL_PREFIX="$jscp$";b.polyfill=function(a,c,e,d){c&&(b.ISOLATE_POLYFILLS?b.polyfillIsolated(a,c,e,d):b.polyfillUnisolated(a,c,e,d))};
b.polyfillUnisolated=function(a,c){var e=b.global;a=a.split(".");for(var d=0;d<a.length-1;d++){var f=a[d];f in e||(e[f]={});e=e[f]}a=a[a.length-1];d=e[a];c=c(d);c!=d&&null!=c&&b.defineProperty(e,a,{configurable:!0,writable:!0,value:c})};
b.polyfillIsolated=function(a,c,e){var d=a.split(".");a=1===d.length;var f=d[0];f=!a&&f in b.polyfills?b.polyfills:b.global;for(var g=0;g<d.length-1;g++){var h=d[g];h in f||(f[h]={});f=f[h]}d=d[d.length-1];e=b.IS_SYMBOL_NATIVE&&"es6"===e?f[d]:null;c=c(e);null!=c&&(a?b.defineProperty(b.polyfills,d,{configurable:!0,writable:!0,value:c}):c!==e&&(b.propertyToPolyfillSymbol[d]=b.IS_SYMBOL_NATIVE?b.global.Symbol(d):b.POLYFILL_PREFIX+d,d=b.propertyToPolyfillSymbol[d],b.defineProperty(f,d,{configurable:!0,
writable:!0,value:c})))};b.initSymbol=function(){};b.polyfill("Symbol",function(a){function c(a){if(this instanceof c)throw new TypeError("Symbol is not a constructor");return new e("jscomp_symbol_"+(a||"")+"_"+d++,a)}function e(a,c){this.$jscomp$symbol$id_=a;b.defineProperty(this,"description",{configurable:!0,writable:!0,value:c})}if(a)return a;e.prototype.toString=function(){return this.$jscomp$symbol$id_};var d=0;return c},"es6","es3");b.initSymbolIterator=function(){};
b.polyfill("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");for(var c="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),e=0;e<c.length;e++){var d=b.global[c[e]];"function"===typeof d&&"function"!=typeof d.prototype[a]&&b.defineProperty(d.prototype,a,{configurable:!0,writable:!0,value:function(){return b.iteratorPrototype(b.arrayIteratorImpl(this))}})}return a},"es6","es3");
b.initSymbolAsyncIterator=function(){};b.iteratorPrototype=function(a){a={next:a};a[Symbol.iterator]=function(){return this};return a};var k=Symbol.for("smth");export function isSmth(a){return a&&!!a[k]}
