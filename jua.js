(function() {
   ////////////////////
   'use strict';
   var plugins = {};
   ////////////////////
 window.getType = function(obj) {
      var type = typeof obj;
      switch (type) {
         case 'string':
            return 'string';
            break;
         case 'object':
            if (obj instanceof Node) {
               return 'node';
            };
            if (obj instanceof Jua.select) {
               return 'jua';
            };
            if (obj instanceof NodeList || obj instanceof HTMLCollection || obj instanceof Array || obj.length) {
               return 'list';
            };
            break;
      };
      return undefined;
   };

   var ConvertToNodes = function(selector, parent) {
      var type = getType(selector);
      var obj = [];
      var parent = parent || document;
      switch (type) {
         case 'string':
            obj.push(...ConvertToNodes(parent.querySelectorAll(selector)));
            break;
         case 'node':
            obj.push(selector);
            break;
         case 'list':
            for (var i = 0; i < selector.length; i++) {
               var n = selector[i];
               if (n && getType(n) == 'node') {
                  obj.push(n);
               } else if (n) {
                  obj.push(...ConvertToNodes(n));
               };
            };

            break;
         case 'jua':
            for (var i = 0; i < selector.length; i++) {
               obj.push(selector[i].node);
            };
            break;
      };
      return obj;
   };

   var newElm = function(names, ownerDoc, ns) {
      var err = () => {
         throw new Error('Given element name is not a type of String or Array');
      };

      ns = ns || 'http://www.w3.org/1999/xhtml';
      if (getType(names) == 'list') {
         if (!(names instanceof Array)) {
            throw new
            err();
         };
         for (var i = 0; i < names.length; i++) {
            if (getType(names[i]) != 'string') {
               err();
            };
         }
      } else if (getType(names) != 'string') {
         err();
      } else {
         if (names.search(',') != -1) {
            names = names.split(',');
         } else if (names.search(' ') != -1) {
            names = names.split(' ');
         } else {
            names = [names];
         }
      };
      var elements = [];
      var ownerDoc = ownerDoc || document;

      for (var i = 0; i < names.length; i++) {
         elements.push(ownerDoc.createElementNS(ns, names[i]));
      };

      return [elements, ownerDoc];
   };

   //////////////////


   var jua = function() {
      this.randomId = () => Math.random().toString(36).slice(2);
      this.timer = function() {
         var starting = Date.now();
         return {
            now: function() {
               return {
                  ms: Date.now() - starting,
                  s: (Date.now() - starting) / 1000,
               }
            }
         };
      };
      this.filter = function(arr) {
         var newArr = [];
         for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (!newArr.includes(e)) {
               newArr.push(e);
            };
         };
         return newArr;
      };
      this.getSelectorPath = function(el) {
         el = ConvertToNodes(el)[0];
         var str = el.tagName;
         str += (el.id != "" && typeof Number(el.id) == NaN) ? "#" + el.id : "";
         if (el.className) {
            var classes = el.className.split(/\s/);
            for (var i = 0; i < classes.length; i++) {
               str += "." + classes[i]
            };
         };
         var index = 1;
         if (el.parentElement) {
            index += Array(...el.parentElement.children).indexOf(el);
         };
         str += ':nth-child(' + index + ')';
         return el.parentElement ? Jua.getSelectorPath(el.parentElement) + " > " + str : str;
      };
      this.plug = function(name, func) {
         plugins[name] = func;
         return Jua();
      };
      this.getUnit = function(val) {
         const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
         if (split) return split[1];
      };
      this.randomColor = function() {
         return "rgb(" + Jua.randomNumber(255) + "," + Jua.randomNumber(255) + "," + Jua.randomNumber(255) + ")";
      };
      this.randomColorObject = function() {
         return {
            red: Jua.randomNumber(255),
            green: Jua.randomNumber(255),
            blue: Jua.randomNumber(255)
         };
      };
      this.random = function(array) {
         if (arguments.length == 1) {
            return array[Math.floor(Math.random() * array.length)];
         } else {
            return arguments[Math.floor(Math.random() * arguments.length)];
         }
      };
      this.randomNumber = function(max = 10) {
         return Math.floor(Math.random() * max);
      };
      this.url = function(param, url) {
         url = url || document.URL;
         var idx = url.indexOf('?');
         var params = {};
         if (idx != -1) {
            var pairs = url.substring(idx + 1, url.length).split('&');
            for (var i = 0; i < pairs.length; i++) {
               var a = pairs[i].split('=');
               params[a[0]] = a[1];
            };
         };
         var val = params[param];
         if (val) {
            return decodeURIComponent(val.replace(/\+/g, " "));
         } else {
            return undefined;
         }
      };
      this.read = function(file, cb, type) {
         type = type || 'dataurl';
         type = type.toLowerCase();
         var reader = new FileReader();
         reader.onload = function() {
            if (typeof cb == "function") {
               cb(reader.result, file, type)
            } else throw new Error("Callback Is Not Typeof Function");
         };

         if (type.search('dataurl') != -1) {
            reader.readAsDataURL(file)
         } else
         if (type.search('binary') != -1) {
            reader.readAsBinaryString(file)
         } else
         if (type.search('buffer') != -1 || type.search('array') != -1) {
            reader.readAsArrayBuffer(file)
         } else
         if (type.search('text') != -1) {
            reader.readAsText(file)
         } else {
            reader.readAsDataURL(file);
         };
      };
      this.get = function(path, cb) {
         var xhttp = new XMLHttpRequest();
         xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
               cb(xhttp.responseText, xhttp);
            }
         };
         xhttp.open("GET", path, true);
         xhttp.send();
      };
      this.select = select;

      function getDistance(p1, p2) {
         return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }

      function getCircleLength(el) {
         return Math.PI * 2 * getAttribute(el, 'r');
      }

      function getRectLength(el) {
         return (getAttribute(el, 'width') * 2) + (getAttribute(el, 'height') * 2);
      }

      function getLineLength(el) {
         return getDistance({
            x: getAttribute(el, 'x1'),
            y: getAttribute(el, 'y1')
         }, {
            x: getAttribute(el, 'x2'),
            y: getAttribute(el, 'y2')
         });
      }

      function getPolylineLength(el) {
         var points = el.points;
         var totalLength = 0;
         var previousPos;
         for (var i = 0; i < points.numberOfItems; i++) {
            var currentPos = points.getItem(i);
            if (i > 0) {
               totalLength += getDistance(previousPos, currentPos);
            }
            previousPos = currentPos;
         }
         return totalLength;
      }

      function getPolygonLength(el) {
         var points = el.points;
         return getPolylineLength(el) + getDistance(points.getItem(points.numberOfItems - 1), points.getItem(0));
      };

      function getTotalLength(el) {
         if (el.getTotalLength) {
            return el.getTotalLength();
         }
         switch (el.tagName.toLowerCase()) {
            case 'circle':
               return getCircleLength(el);
            case 'rect':
               return getRectLength(el);
            case 'line':
               return getLineLength(el);
            case 'polyline':
               return getPolylineLength(el);
            case 'polygon':
               return getPolygonLength(el);
         };
      };

      this.dashOffset = function(el) {
         el = Jua(el).node;
         var pathLength = getTotalLength(el);
         el.setAttribute('stroke-dasharray', pathLength);
         return pathLength;
      };



      this.colorGradient = function(rgbColor1 = Jua.randomColorObject(), rgbColor2 = Jua.randomColorObject(), rgbColor3 = Jua.randomColorObject()) {
         return function(fadeFraction) {
            var color1 = rgbColor1;
            var color2 = rgbColor2;
            var fade = fadeFraction;

            if (rgbColor3) {
               fade = fade * 2;

               if (fade >= 1) {
                  fade -= 1;
                  color1 = rgbColor2;
                  color2 = rgbColor3;
               }
            }

            var diffRed = color2.red - color1.red;
            var diffGreen = color2.green - color1.green;
            var diffBlue = color2.blue - color1.blue;

            var gradient = {
               red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
               green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
               blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
            };
            return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
         };
      };
   };

   var select = function(selector, parent) {
         if (!new.target) {
            return new Jua.select(selector, parent);
         };
         parent = parent || document;
         const Proto = this.__proto__;
         var nodes = ConvertToNodes(selector);
         nodes = new jua().filter(nodes);

         for (let x in plugins) {
            Proto[x] = plugins[x];
         };
         const _this = this;
         this.selector = selector;
         this.node = nodes[0];
         this.length = nodes.length;

         if (nodes.length == 0 || nodes.length == 1) {
            this[0] = this;
            if (this.node && !this.node.JUA_ID) {
               this.node.JUA_ID = new jua().randomId();
            };
         } else {
            for (var i = 0; i < nodes.length; i++) {
               if (!nodes[i].JUA_ID) {
                  nodes[i].JUA_ID = new jua().randomId();
               };
               this[i] = new Jua(nodes[i], parent);
            };
         };

         //----------------------------------------------
         Proto.forEach = Proto.each = function() {
            for (var i = 0; i < this.length; i++) {
               var node = this[i];
               for (var a = 0; a < arguments.length; a++) {
                  if (typeof arguments[a] == 'function') {
                     arguments[a].apply(this, [node, i, this]);
                  }
               };

            };
            return this;
         };
         //----------------------------------------------
         Proto.map = function(cb) {
            var arr = [];
            this.each(function() {
               arr.push(cb.apply(this, arguments));
            });
            return arr;
         };
         //----------------------------------------------
         Proto.clone = function(childs = false) {
            return new Jua(this.map(function(e) {
               return e.node.cloneNode(childs);
            }));
         };
         //----------------------------------------------
         Proto.append = function(elements, clone = false) {
            if (typeof elements == 'string') {
               this.each(function(n) {
                  n.node.innerHTML += elements;
               });
               return this;
            }
            var nodes = ConvertToNodes(elements);
            this.each(function(n) {
               nodes.forEach(function(n1) {
                  clone ? n.node.appendChild(n1.cloneNode(true)) : n.node.appendChild(n1);
               });
            });
            return this;
         };
         //----------------------------------------------
         Proto.appendTo = function(elements, clone) {
            Jua(elements).append(this, clone);
            return this;
         };
         //----------------------------------------------
         Proto.push = function(nodes) {
            return new Jua([this, nodes]);
         };
         //----------------------------------------------
         Proto.child = function(child) {
            if (typeof child == 'string') {
               return this.jua(child);
            } else if (child) {
               this.append(child);
            } else {
               return new Jua(this.map(function(n) {
                  return n.node.children;
               }));
            }
            return this;
         };
         //----------------------------------------------
         Proto.on = Proto.event = function(type, cb, opt) {
            var _this = this;
            this.each(function(e) {
               e.node.addEventListener(type, cb, opt);
            });
            return {
               cancel: function() {
                  _this.each(function(e) {
                     e.node.removeEventListener(type, cb, opt);
                  });
                  return _this;
               }
            };
         };

         /*events*/
         //----------------------------------------------
         Proto.click = (cb, opt) => {
            return Proto.on('click', cb, opt);
         };
         //----------------------------------------------
         Proto.dblclick = (cb, opt) => {
            return Proto.on('dblclick', cb, opt);
         };
         //----------------------------------------------
         Proto.focus = (cb, opt) => {
            return Proto.on('focus', cb, opt);
         };
         //----------------------------------------------
         Proto.keyup = (cb, opt) => {
            return Proto.on('keyup', cb, opt);
         };
         //----------------------------------------------
         Proto.keydown = (cb, opt) => {
            return Proto.on('keydown', cb, opt);
         };
         //----------------------------------------------
         Proto.keypress = (cb, opt) => {
            return Proto.on('keypress', cb, opt);
         };
         //----------------------------------------------
         Proto.mousedown = (cb, opt) => {
            return Proto.on('mousedown', cb, opt);
         };
         //----------------------------------------------
         Proto.mouseup = (cb, opt) => {
            return Proto.on('mouseup', cb, opt);
         };
         /*events*/
         //----------------------------------------------
         Proto.remove = function() {
            this.each(function(n) {
               n.node.remove();
            });
            return this;
         };
         //----------------------------------------------
         Proto.empty = function() {
            this.child().remove();
            return this;
         };
         //----------------------------------------------
         Proto.pick = Proto.get = function(num) {
            return this[num];
         };
         //----------------------------------------------
         Proto.path = Proto.getSelectorPath = Proto.getSelector = function() {
            return new jua().getSelectorPath(this.node);
         };
         //----------------------------------------------
         Proto.hasAttr = function(name) {
            return Boolean(e.node.hasAttribute(name));
         };
         //----------------------------------------------
         Proto.select = Proto.Jua = Proto.jua = function(selector) {
            var nodes = [];
            this.each(function(e) {
               nodes.push(e.node.querySelectorAll(selector));
            });
            return Jua(nodes);
         };
         //----------------------------------------------
         Proto.log = function() {
            console.log(this, ...arguments);
            return this;
         };
         //----------------------------------------------
         Proto.next = function() {
            return Jua(this.node.nextElementSibling);
         };
         //----------------------------------------------
         Proto.prev = function() {
            return Jua(this.node.previousElementSibling);
         };
         //----------------------------------------------
         Proto.parent = function() {
            return Jua(this.node.parentNode);
         };
         //----------------------------------------------
         Proto.push = function(nodes) {
            return Jua([this, nodes]);
         };
         //----------------------------------------------
         Proto.random = function() {
            return this[new jua().randomNumber(this.length)];
         };
         //----------------------------------------------
         Proto.ready = function(cb) {
            if (typeof cb != 'function') {
               return this;
            };

            if (node instanceof Document) {
               if (node.readyState === "complete" ||
                  node.readyState === "interactive") {
                  this.on("load", cb);
               } else {
                  this.on("DOMContentLoaded", cb);
               };
            } else {
               cb(this);
            };
            return this;
         };
         //----------------------------------------------
         Proto.tagName = function() {
            return this.node.tagName;
         };
         //----------------------------------------------
         Proto.toArray = function() {
            return this.map((e) => e.node);
         };
         //----------------------------------------------
         Proto.juaId = function() {
            return this.node.JUA_ID;
         };
         //----------------------------------------------
         Proto.insertBefore = function(node, clone = false) {
            this.each(function(e) {
               node = ConvertToNodes(nodes);
               for (var i = 0; i < node.length; i++) {
                  if (clone) {
                     e.node.insertAdjacentElement("beforeBegin", node[i].cloneNode(true));
                  } else {
                     e.node.insertAdjacentElement("beforeBegin", node[i]);
                  };
               }
            });
            return this;
         };
         //----------------------------------------------
         Proto.insertAfter = function(node, clone = false) {
            this.each(function(e) {
               node = ConvertToNodes(nodes);
               for (var i = 0; i < node.length; i++) {
                  if (clone) {
                     e.node.insertAdjacentElement("afterEnd", node[i].cloneNode(true));
                  } else {
                     e.node.insertAdjacentElement("afterEnd", node[i]);
                  };
               }
            });
            return this;
         };
         //----------------------------------------------
         /* for three Similar functions */

         var types = {
            text: 'textContent',
            html: 'innerHTML',
            val: 'value',
         }
         var change = function(type, str, add = false) {
            if (!str) {
               str = '';
            };


            if (typeof str == 'function') {
               _this.each(function(e) {
                  if (add) {
                     e.node[types[type]] += str(...arguments);
                  } else {
                     e.node[types[type]] = str(...arguments);
                  };
               });
            } else {
               _this.each(function(e) {
                  if (add) {
                     e.node[types[type]] += str;
                  } else {
                     e.node[types[type]] = str;
                  };
               });
            };

            return this;
         };
         /* for three Similar functions */
         //----------------------------------------------
         Proto.html = (html, add) => {
            return change('html', html, add);
         }
         //----------------------------------------------
         Proto.text = (text, add) => {
            return change('text', text, add);
         }
         //----------------------------------------------
         Proto.val = (val, add) => {
            return change('val', val, add);
         }
         //----------------------------------------------
         Proto.reomveAttr = function(name) {
            this.each((e) => e.node.removeAttribute(name));
            return this;
         };
         //----------------------------------------------
         Proto.attr = function(name, value) {
            var n = 0,
               v = 0;
            if (name) {
               n = 1
            };
            if (value == 0 || value) {
               v = 1;
            };
            var _this = this;
            var tn = typeof name == 'function' ? 1 : 0;
            var tv = typeof value == 'function' ? 1 : 0;
            var arr = '' + n + v + tn + tv;
            switch (arr) {
               case '1101':
                  _this.each(function(n, i) {
                     var get = n.node.getAttribute(name);
                     n.attr(name, value(n, get, name, i, _this));
                  });
                  break;
               case '1100':
                  _this.each(function(n) {
                     n.node.setAttribute(name, value);
                  });
                  break;
               case '1010':
                  _this.each(function(n, i) {
                     n.attr(name(n, i, _this));
                  });
                  break;
               case '1000':
                  if (typeof name == 'object') {
                     for (let x in name) {
                        _this.attr(x, name[x]);
                     };
                  } else {
                     return _this.node.getAttribute(name);
                  };
                  break;
               case '0000':
                  var attr = {};
                  _this.node.getAttributeNames().forEach(function(name) {
                     attr[name] = _this.attr(name);
                  });
                  return attr;
                  break;
            };
            return this;
         };
         //----------------------------------------------
         Proto.id = function(id) {
            return this.attr('id', id);
         }
         //----------------------------------------------
         Proto.css = Proto.class = Proto.style = function(name, value) {
            var getC = window.getComputedStyle;
            var n = 0,
               v = 0;
            if (name) {
               n = 1
            };
            if (value == 0 || value) {
               v = 1;
            };
            var _this = this;
            var tn = typeof name == 'function' ? 1 : 0;
            var tv = typeof value == 'function' ? 1 : 0;
            var arr = '' + n + v + tn + tv;

            switch (arr) {
               case '1101':
                  _this.each(function(n, i) {
                     var get = getC(n.node)[name];
                     n.class(name, value(n, get, name, i, _this));
                  });
                  break;
               case '1100':
                  _this.each(function(n) {
                     n.node.style[name] = value;
                  });
                  break;
               case '1010':
                  _this.each(function(n, i) {
                     n.class(name(n, i, _this));
                  });
                  break;
               case '1000':
                  if (typeof name == 'object') {
                     for (let x in name) {
                        _this.class(x, name[x]);
                     };
                  } else {
                     return getC(_this.node)[name];
                  };
                  break;
               case '0000':
                  return getC(_this.node);
                  break;
            };
            return this

         };
         //----------------------------------------------
         Proto.plug = function(name, func) {
            plugins[name] = func;
            return this;
         };
         //----------------------------------------------
         //----------------------------------------------
         //----------------------------------------------
         //----------------------------------------------

   };

   ///////////////////////////////// init function ///////////

   var Jua = function(selector, parent, ns) {
      if (new.target) {
         return select(...newElm(selector, parent, ns));
      } else if (selector) {
         return select(selector);
      } else {
         return new jua();
      };
   };
   var func = new jua();
   for (let x in func) {
      Jua[x] = func[x];
   };

   //////////////////////////////// animation ////////////////
 {
   var penner = (function() {
      var eases = {
         linear: function() {
            return function(t) {
               return t;
            };
         }
      };

      var functionEasings = {
         Sine: function() {
            return function(t) {
               return 1 - Math.cos(t * Math.PI / 2);
            };
         },
         Circ: function() {
            return function(t) {
               return 1 - Math.sqrt(1 - t * t);
            };
         },
         Back: function() {
            return function(t) {
               return t * t * (3 * t - 2);
            };
         },
         Bounce: function() {
            return function(t) {
               var pow2, b = 4;
               while (t < ((pow2 = Math.pow(2, --b)) - 1) / 11) {}
               return 1 / Math.pow(4, 3 - b) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - t, 2)
            };
         },
         Elastic: function(amplitude, period) {
            if (amplitude === void 0) amplitude = 1;
            if (period === void 0) period = .5;

            var a = Func.minMax(amplitude, 1, 10);
            var p = Func.minMax(period, .1, 2);
            return function(t) {
               return (t === 0 || t === 1) ? t :
                  -a * Math.pow(2, 10 * (t - 1)) * Math.sin((((t - 1) - (p / (Math.PI * 2) * Math.asin(1 / a))) * (Math.PI * 2)) / p);
            }
         }
      };

      var baseEasings = ['Quad', 'Cubic', 'Quart', 'Quint', 'Expo'];

      baseEasings.forEach(function(name, i) {
         functionEasings[name] = function() {
            return function(t) {
               return Math.pow(t, i + 2);
            };
         };
      });

      Object.keys(functionEasings).forEach(function(name) {
         var easeIn = functionEasings[name];
         eases['easeIn' + name] = easeIn;
         eases['easeOut' + name] = function(a, b) {
            return function(t) {
               return 1 - easeIn(a, b)(1 - t);
            };
         };
         eases['easeInOut' + name] = function(a, b) {
            return function(t) {
               return t < 0.5 ? easeIn(a, b)(t * 2) / 2 :
                  1 - easeIn(a, b)(t * -2 + 2) / 2;
            };
         };
         eases['easeOutIn' + name] = function(a, b) {
            return function(t) {
               return t < 0.5 ? (1 - easeIn(a, b)(1 - t * 2)) / 2 :
                  (easeIn(a, b)(t * 2 - 1) + 1) / 2;
            };
         };
      });

      return eases;

   })();

   function steps(step) {
      if (step === void 0) step = 5;
      return function(t) {
         return Math.ceil((Func.minMax(t, 0.000001, 1)) * step) * (1 / step);
      };
   }

   var bezier = (function() {

      var kSplineTableSize = 11;
      var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

      function A(aA1, aA2) {
         return 1.0 - 3.0 * aA2 + 3.0 * aA1
      }

      function B(aA1, aA2) {
         return 3.0 * aA2 - 6.0 * aA1
      }

      function C(aA1) {
         return 3.0 * aA1
      }

      function calcBezier(aT, aA1, aA2) {
         return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
      }

      function getSlope(aT, aA1, aA2) {
         return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1)
      }

      function binarySubdivide(aX, aA, aB, mX1, mX2) {
         var currentX, currentT, i = 0;
         do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
               aB = currentT;
            } else {
               aA = currentT;
            }
         } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
         return currentT;
      }

      function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
         for (var i = 0; i < 4; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) {
               return aGuessT;
            }
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
         }
         return aGuessT;
      }

      function bezier(mX1, mY1, mX2, mY2) {

         if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
            return;
         }
         var sampleValues = new Float32Array(kSplineTableSize);

         if (mX1 !== mY1 || mX2 !== mY2) {
            for (var i = 0; i < kSplineTableSize; ++i) {
               sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
         }

         function getTForX(aX) {

            var intervalStart = 0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
               intervalStart += kSampleStepSize;
            }

            --currentSample;

            var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;
            var initialSlope = getSlope(guessForT, mX1, mX2);

            if (initialSlope >= 0.001) {
               return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            } else if (initialSlope === 0.0) {
               return guessForT;
            } else {
               return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            }

         }

         return function(x) {
            if (mX1 === mY1 && mX2 === mY2) {
               return x;
            }
            if (x === 0 || x === 1) {
               return x;
            }
            return calcBezier(getTForX(x), mY1, mY2);
         }

      }

      return bezier;

   })();

   // plug anim in Jua

   Jua.plug('anim', JuaAnim);
   Jua.plug('anime', JuaAnim);
   Jua.plug('animate', JuaAnim);

   var cache = {};

   // Simple Functions

   window.Func = {
      to: {
         progress: (t, d) => {
            return t / d * 100;
         },
         time: (p, d) => {
            return p / 100 * d;
         },
         color: (t, v) => {
            return colorTypesToRgba[t](v);
         },
      },
      get: {
         max: function(array) {
            return Math.max.apply(null, array);
         },
         unit: (str) => {
            str = String(str);
            const s = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(str);
            return s ? s[1] : undefined;
         },
         transformUnit: (type) => {
            if (Func.is.strContains(type, 'translate') || Func.is.strContains(type, 'perspective')) {
               return 'px'
            };
            if (Func.is.strContains(type, 'skew') || Func.is.strContains(type, 'rotate')) {
               return 'deg'
            };
            return '';
         },
         valueType: (val) => {
            if (val == 'none' || val == null || Number.isNaN(val)) {
               return undefined
            };
            if (Func.is.transform(val)) {
               return 'transform';
            };
            if (Func.is.col(val)) {
               return 'color';
            };
            if (Func.is.num(val)) {
               return 'number';
            };
            return 'string';
         },
         easingType: (ease) => {
            var regex = /\w+/i
            return regex.exec(ease).length ? regex.exec(ease)[0] : 'linear';
         },
         animateType: (el, prop) => {
            if (((el.attr(prop) != null) || Func.is.svg(el) && el.node[prop])) {
               return 'attr';
            };
            return 'css';
         },
         num: (val = '') => {
            if (!val) {
               val = '0'
            }
            if (typeof val == 'number') {
               val = val + ''
            };
            var regex = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
            return (val.match(regex) || ['0']).map((n) => {
               return parseFloat(n);
            });
         },
         str: (val = '') => {
            if (!val) {
               val = ''
            }
            if (typeof val == 'number') {
               val = val + ''
            };
            var regex = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
            val = val.replaceAll(regex, '[splitter][splitter]').split('[splitter]').map(function(v, i, n) {
               n = n[i + 1];
               if (v == '' && n == '') {
                  return undefined;
               };
               return v;
            });
            var newVal = [];
            val.forEach(function(v) {
               if (!Func.is.und(v)) {
                  newVal.push(v);
               };
            });
            return (newVal || ['']);
         },
         flatArr: (arr) => {
            var arr1 = [];
            arr.forEach((v) => {
               Func.is.arr(v) ? arr1.push(...Func.get.flatArr(v)) : arr1.push(v);
            });
            return arr1;
         },
      },
      is: {
         und: function(a) {
            return a == undefined;
         },
         svg: function(a) {
            return a instanceof SVGElement;
         },
         num: (a) => {
            return !isNaN(parseFloat(a));
         },
         hex: function(a) {
            a = a.substr(a.indexOf('#') - 1, a.length)
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a) ? 'hex' : false;
         },
         rgb: function(a) {
            a = a.substr(a.indexOf('rgb') - 1, a.length)
            return /^rgb/.test(a) ? 'rgb' : false;
         },
         hsl: function(a) {
            a = a.substr(a.indexOf('hsl') - 1, a.length)
            return /^hsl/.test(a) ? 'hsl' : false;
         },
         col: function(a) {
            a = String(a);
            return (Func.is.hex(a) || Func.is.rgb(a) || Func.is.hsl(a));
         },
         arr: function(a) {
            return a instanceof Array;
         },
         strContains: (str, search) => {
            return Func.strIndex(str, search) > -1;
         },
         arrContains: (arr, val) => {
            return arr.some((v) => {
               return String(val).search(v) != -1;
            })
         },
         transform: (val) => {
            return Func.is.arrContains(validTransforms, val);
         },
      },


      // Extra
      cloneObj: function(o) {
         var clone = {};
         for (var p in o) {
            clone[p] = o[p];
         }
         return clone;
      },
      call: (func, args) => {
         typeof func == 'function' ? func(...(args || [])) : '';
      },
      strIndex: (str, search) => {
         return str.indexOf(search);
      },
      minMax: (val, min, max) => {
         return Math.min(Math.max(val, min), max);
      },
   };

   /// Colour

   function parseColor(val, i, r) {
      if (typeof val != 'string') {
         return colorTypesToRgba.rgb('rgb(0,0,0)')
      } else {
         if (!r && !Func.is.col(val)) {
            var tempEl = new Jua('div');
            tempEl.class({
               position: 'absolute',
                  display: 'flex',
                  background: val,
            });
            Jua('body').append(tempEl);
            var c = tempEl.css('background');
            tempEl.remove();
            return parseColor(c, 1, true);
         } else {
            return Func.to.color(Func.is.col(val), val);
         };
      };
   };

   const colorTypesToRgba = {
      rgb: function(rgbValue) {
         var rgb = /rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(rgbValue);
         return new rgba(...rgb[1].split(','));
      },
      hex: function(hexValue) {
         var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
         var hex = hexValue.replace(rgx, function(m, r, g, b) {
            return r + r + g + g + b + b;
         });
         var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
         var r = parseInt(rgb[1], 16);
         var g = parseInt(rgb[2], 16);
         var b = parseInt(rgb[3], 16);
         return new rgba(r, g, b);
      },
      hsl: function(hslValue) {
         var hsl = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(hslValue) || /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(hslValue);
         var h = parseInt(hsl[1], 10) / 360;
         var s = parseInt(hsl[2], 10) / 100;
         var l = parseInt(hsl[3], 10) / 100;
         var a = hsl[4] || 1;

         function hue2rgb(p, q, t) {
            if (t < 0) {
               t += 1;
            }
            if (t > 1) {
               t -= 1;
            }
            if (t < 1 / 6) {
               return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
               return q;
            }
            if (t < 2 / 3) {
               return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
         }
         var r, g, b;
         if (s == 0) {
            r = g = b = l;
         } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3) * 255;
            g = hue2rgb(p, q, h) * 255;
            b = hue2rgb(p, q, h - 1 / 3) * 255;
         }
         return new rgba(r, g, b, a);
      },
   };

   function rgba(r, g, b, a) {
      this[0] = parseFloat(r);
      this[1] = parseFloat(g);
      this[2] = parseFloat(b);
      this[3] = a || 1;
   };


   // CSS transform

   function convertToMatrix3d(matrix) {
      const [a, b, c, d, e, f] = Func.get.num(matrix);
      const matrix3d = "matrix3d("+a+", "+b+", 0, 0, "+c+", "+d+", 0, 0, 0, 0, 1, 0, "+e+", "+f+", 0, 1)";
      return matrix3d;
   };

   function parsetransform(val) {
      if (typeof val != 'string') {
         return []
      };
      var transforms = [];
      var reg = /(\w+)\(([^)]*)\)/ig;
      var m;
      while (m = reg.exec(val)) {
         if (Number.isNaN(Number(m[2]))) {
            continue
         };
         if (m[2].split(',').length == 2) {
            var vals = m[2].split(',');
            transforms.push({
               name: m[1] + 'X',
               val: pxToUnit(undefined, vals[0], 'px') * parseFloat(vals[0]),
            });
            transforms.push({
               name: m[1] + 'Y',
               val: pxToUnit(undefined, vals[1], 'px') * parseFloat(vals[1]),
            });
            continue;
         } else {
            var except = ['scale', 'perspective', 'rotate']
            if (except.indexOf(m[1]) == -1 && !(new Jua.transform().hasOwnProperty(m[1]))) {
               m[1] += 'X';
            } else {
               if (m[1] == 'scale') {
                  transforms.push({
                     name: 'scaleX',
                     val: parseFloat(m[2]),
                  });
                  transforms.push({
                     name: 'scaleY',
                     val: parseFloat(m[2]),
                  });
                  continue;
               };
               if (m[1] == 'rotate') {
                  transforms.push({
                     name: 'rotateZ',
                     val: parseFloat(m[2]),
                  });
                  continue;
               };
            };
            transforms.push({
               name: m[1],
               val: pxToUnit(undefined, m[2], 'px') * parseFloat(m[2]),
            });
         };
      };
      return transforms;
   };

   Jua.transform = function(val) {
      if (!(/matrix3d/.test(val))) {
         if (!(/matrix/.test(val))) {
            var t = new Jua.transform('matrix3d( 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)');
            parsetransform(val).forEach(function(v) {
               t[v.name] = v.val;
            });
            return t;
         };
         val = convertToMatrix3d(val);
      };
      val = val || 'matrix3d( 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)';
      const matrixPattern = /matrix3d\((.+)\)/;
      const matrixValues = val.match(matrixPattern)[1].split(",");
      const m11 = parseFloat(matrixValues[0]);
      const m12 = parseFloat(matrixValues[1]);
      const m13 = parseFloat(matrixValues[2]);
      const m14 = parseFloat(matrixValues[3]);
      const m21 = parseFloat(matrixValues[4]);
      const m22 = parseFloat(matrixValues[5]);
      const m23 = parseFloat(matrixValues[6]);
      const m24 = parseFloat(matrixValues[7]);
      const m31 = parseFloat(matrixValues[8]);
      const m32 = parseFloat(matrixValues[9]);
      const m33 = parseFloat(matrixValues[10]);
      const m34 = parseFloat(matrixValues[11]);
      const m41 = parseFloat(matrixValues[12]);
      const m42 = parseFloat(matrixValues[13]);
      const m43 = parseFloat(matrixValues[14]);
      const m44 = parseFloat(matrixValues[15]);

      this.translateX = m41;
      this.translateY = m42;
      this.translateZ = m43;

      const scaleXSq = m11 * m11 + m12 * m12 + m13 * m13;
      this.scaleX = Math.sqrt(scaleXSq);
      this.skewY = Math.acos(m11 / this.scaleX) * (180 / Math.PI);

      const scaleYSq = m21 * m21 + m22 * m22 + m23 * m23;
      this.scaleY = Math.sqrt(scaleYSq);
      this.skewX = Math.acos(m22 / this.scaleY) * (180 / Math.PI);

      const scaleZSq = m31 * m31 + m32 * m32 + m33 * m33;
      this.scaleZ = Math.sqrt(scaleZSq);

      this.rotateY = Math.atan2(-m31, Math.sqrt(m11 * m11 + m12 * m12)) * (180 / Math.PI);
      this.rotateX = Math.atan2(m32, m33) * (180 / Math.PI);
      this.rotateZ = Math.atan2(m12, m22) * (180 / Math.PI);
      this.perspective = (-1 / m34).toFixed(2);
   };

   //Default
   var defaultParams = {
      suspendWhenDocumentHidden: true,

      speed: 1,

      update: null,

      begin: null,
      complete: null,

      loopBegin: null,
      loopComplete: null,

      loop: 1,
      loopCompleted: 0,
      currentLoop: 0,
      direction: 'normal',
      autoplay: true,

      delay: 0,
      endDelay: 0,

      duration: 1000,
      easing: 'easeOutElastic(1, .5)',
      easingFunc: null,
      round: 0,
   };

   const directions = ['reverse', 'normal', 'alternate'];
   const validTransforms = ['translate', 'translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'perspective', 'matrix', 'matrix3d'];



   // init animation

   Jua.animate = initAnimation;


   window.easings = Jua.easings = {
      bezier: bezier,
      steps: steps,
   };

   for (let x in penner) {
      easings[x] = penner[x]
   };

   function JuaAnim() {
      return new initAnimation(this, ...arguments);
   };

   function normalize(css) {
      var type = typeof css;
      var arr = [];
      switch (type) {
         case 'object':
            if (Func.is.arr(css)) {
               arr.push(...css.map((v) => {
                  return normalize(v);
               }))
            } else {
               arr.push(css);
            };
            break;

         default:
            arr.push(css);
      };
      return Func.get.flatArr(arr);
   };

   function getValue(val, t, i, l) {
      var type = typeof val;
      var value = 0;
      var params = {};
      switch (type) {
         case 'string':
         case 'number':
            value = val;
            break;

         case 'object':
            value = val.value;
            for (let x in val) {
               if (x == 'value') {
                  continue;
               };
               params[x] = typeof val[x] == 'function' ? val[x](t, i, l) : val[x];
            };
            break;

         case 'function':
            value = getValue(val(t, i, l)).value;
            break;
      };
      return {
         value: value,
         params: params
      };
   };

   function pxToUnit(el, value, unit) {
      el = el || Jua('body');
      var valueUnit = Func.get.unit(value) || 'px';
      if (Func.is.arrContains([unit, 'deg', 'rad', 'turn'], valueUnit)) {
         return 1;
      };
      if (cache[el.juaId() + '_' + valueUnit + '_to_' + unit]) {
         return cache[el.juaId() + '_' + valueUnit + '_to_' + unit]
      };
      var baseline = 100;
      var tempEl = new Jua(el.tagName());
      var parentEl = (el.parent() && (el.parent() !== document)) ? el.parent() : document.body;
      parentEl.append(tempEl);
      tempEl.css('position', 'absolute');
      if (unit == 'px') {
         tempEl.css('width', baseline + valueUnit);
         var factor = tempEl.node.offsetWidth / baseline;
      } else {
         tempEl.css('width', baseline + unit);
         var factor = baseline / tempEl.node.offsetWidth;
      };

      tempEl.remove();
      cache[el.juaId() + '_' + valueUnit + '_to_' + unit] = factor;
      return factor;
   };

   function getRelativeValue(to, from) {
      var operator = /^(\*=|\+=|-=)/.exec(to);
      if (!operator) {
         return to;
      }
      var u = Func.get.unit(to) || 0;
      var x = parseFloat(from);
      var y = parseFloat(to.replace(operator[0], ''));
      switch (operator[0][0]) {
         case '+':
            return x + y + u;
         case '-':
            return x - y + u;
         case '*':
            return x * y + u;
      }
   };

   function decomposeValue(val) {
      return {
         original: val,
         numbers: Func.get.num(val),
         strings: Func.get.str(val),
         unit: Func.get.unit(val),
      };
   };

   function parseEasings(ease) {
      if (typeof ease == 'function') {
         return {
            type: 'function',
            num: [],
            func: ease
         }
      };
      var i = {
         type: Func.get.easingType(ease),
         num: Func.get.num(ease),
      };
      i.func = easings[i.type](...i.num);
      return i;
   };

   function createAnimations(prop, value, target, targetIndex, length, splitA, startTime) {
      var split = {
         params: {},
         css: splitA.css,
      };
      for (let x in splitA.params) {
         if ((x == 'delay' || x == 'endDelay' || x == 'duration') && typeof splitA.params[x] == 'function') {
            split.params[x] = splitA.params[x](target, targetIndex, length);
         } else {
            split.params[x] = splitA.params[x];
         };
      };

      value = normalize(value);
      var animation = {};
      animation.propName = prop;
      animation.target = target;
      animation.targetLength = length;
      animation.type = Func.get.animateType(target, prop);
      animation.duration = split.params.duration;
      animation.delay = split.params.delay;
      animation.endDelay = split.params.endDelay;
      animation.easing = split.params.easing;
      animation.currentValue = null;
      animation.tweens = [];


      var from = Func.is.transform(prop) ? animation.target.css('transform') : animation.target.css(prop) || animation.target.attr(prop);
      if (value.length == 2) {
         from = getValue(value[0], target, targetIndex, length).value;
         value = [value[1]];
      };
      var lastEnd = startTime || 0;
      var len = value.length;
      var prevTween = {};
      for (var i = 0; i < value.length; i++) {
         var t = new Tween(value[i], i);
         animation.tweens.push(t);
         prevTween = t;
      };

      function Tween(v, i) {
         if (v.value && Func.is.arr(v.value)) {
            if (v.value.length == 2) {
               from = getValue(v.value[0]).value;
               v = v.value[1];
            };
            v = v.value[0];
         };
         var tween = this;
         var value = this.value = getValue(v, target, targetIndex, length);
         var val = this.val = this.value.value;
         var params = this.params = this.value.params;
         var get = (params, prop) => {
            var val = params[prop] || animation[prop] || split.params[prop];
            return val;
         };
         tween.delay = parseFloat(params['delay']) || 0;
         tween.endDelay = parseFloat(params['endDelay']) || 0;
         if (i == 0 && !tween.delay) {
            tween.delay = get(tween.params, 'delay');
         };
         if (len - 1 == i && !tween.endDelay) {
            tween.endDelay = get(tween.params, 'endDelay');
         };

         tween.easing = get(tween.params, 'easing');
         var ease = parseEasings(tween.easing);
         tween.easingType = ease.type;
         tween.easingParameters = ease.num;
         tween.easingFunc = get(tween.params, 'easingFunc') || ease.func;
         tween.valueType = prevTween.valueType || (Func.is.transform(prop) ? 'transform' : undefined) || Func.get.valueType(from) || Func.get.valueType(val);
         tween.animateType = get(tween.params, 'animateType') == 'attr' || get(tween.params, 'animateType') == 'css' ? get(tween.params, 'animateType') : Func.get.animateType(animation.target, animation.propName);
         tween.round = get(tween.params, 'round') || 0;
         tween.value = val;
         tween.propName = prop;

         tween.duration = parseFloat(params['duration']) || animation.duration / len;
         tween.start = lastEnd + tween.delay;
         tween.end = tween.start + tween.duration;
         lastEnd = tween.end + tween.endDelay;

         tween.from = decomposeValue(from);
         tween.to = decomposeValue(val);
         tween.unit = tween.to.unit || (tween.from.unit || prevTween.unit);
         tween.unit = tween.unit ? tween.unit : '';

         if (tween.to.numbers.length == 1 && tween.from.numbers.length == 1) {
            tween.from = decomposeValue((pxToUnit(target, tween.from.original, tween.unit) * tween.from.numbers[0]) + tween.unit);
            tween.to = decomposeValue(getRelativeValue(val, tween.from.numbers[0]));
            if (!tween.to.unit) {
               tween.to = decomposeValue(tween.to.original + tween.unit);
            };
         };
         if (tween.valueType == 'transform') {
            if (Func.is.transform(prop)) {
               tween.from = new Jua.transform(tween.from.original);
               tween.to = new Jua.transform(prop + '(' + val + ')');
            } else {
               tween.from = new Jua.transform(tween.from.original);
               tween.to = new Jua.transform(tween.to.original);
            }
         };

         if (tween.valueType == 'color') {
            set('from');
            set('to');

            function set(prop) {
               prop = tween[prop];
               var color = parseColor(prop.original);
               prop.strings = [];
               prop.numbers = [];
               prop.strings.push('rgba(');
               for (var i = 0; i < 4; i++) {
                  prop.numbers.push(color[i]);
                  prop.strings.push('');
                  prop.strings.push(',');
               };
               prop.strings[prop.strings.length - 1] = ')';
            };
         };
         from = tween.to.original;
      };

      animation.duration = lastEnd;
      animation.delay = animation.tweens[0].delay;
      animation.endDelay = animation.tweens[len - 1].endDelay;
      return animation;
   };

   function splitParams(param) {
      let split = {
         params: defaultParams,
         css: {}
      };
      for (let name in param) {
         var n = name;
         var v = param[name];
         if (n in defaultParams) {
            var dv = defaultParams[n];
            if (n == 'direction') {
               if (Func.is.num(v) && !Number.isNaN(v) && -1 <= v && v <= 1) {
                  split.params[n] = directions[parseInt(v) + 1];
                  continue;
               } else if (!Func.is.arrContains(directions, v)) {
                  split.params[n] = 'normal';
                  continue;
               };
            };
            if (Func.is.und(v)) {
               continue;
            }
            split.params[n] = v;
         } else {
            if (Func.is.und(v)) {
               continue;
            };
            if (n == 'keyframes') {
               split.params[n] = v;
               continue;
            };
            split.css[n] = v;
         };
      };
      return split;
   };

   function initAnimation(targets, cssOld, duration, easing) {
      var css = Func.cloneObj(cssOld);

      css.duration = duration || css.duration;
      css.easing = easing || css.easing;
      const split = splitParams(css);
      var params = split.params;
      var css = split.css;
      var targets = Jua(targets);
      params.currentProgress = 0;
      params.currentTime = 0;
      params.isPlaying = false;
      params.isPaused = true;
      params.isCompleted = false;
      params.remaining = params.loop;
      params.isReverse = params.direction == 'reverse' ? true : false;
      params.fps = 0;
      var animations = [];

      if (params.keyframes) {
         css = {};
         var nothing = '+=0';
         for (var i = 0; i < params.keyframes.length; i++) {
            var keyframe = params.keyframes[i];
            for (let x in keyframe) {
               if (!css[x]) {
                  css[x] = [];
               };

               css[x][i] = keyframe[x];
            };
         };
         for (let x in css) {
            for (var i = 0; i < params.keyframes.length; i++) {
               if (css[x][i] == undefined) {
                  css[x][i] = nothing
               };
            };
         };
      };

      for (let x in css) {
         targets.each(function(t, i) {
            animations.push(createAnimations(x, css[x], t, i, targets.length, split));
         });
      };

      if (animations[0]) {
         params.duration = Func.get.max(animations.map((v) => {
            return v.duration
         }));
         params.delay = Func.get.max(animations.map((v) => {
            return v.delay
         }));
         params.endDelay = Func.get.max(animations.map((v) => {
            return v.endDelay
         }));
      };

      params.animations = animations;
      params.css = css;
      var animator = new Animater(animations, params, css, loop);
      var played = false;

      function handleVisibilityChange() {
         if (document.hidden) {
            if (animator.isPlaying) {
               animator.pause();
               played = true;
            };
         } else {
            if (played) {
               animator.play();
               played = false;
            };
         };
      };

      if (params.suspendWhenDocumentHidden) {
         document.addEventListener("visibilitychange", handleVisibilityChange, false);
      };

      function loop(isCompleted = false, autoplay) {
         if (animator.loop != true && animator.loop == animator.loopCompleted) {
            return;
         };
         if (animator.direction == 'alternate') {
            if (!isCompleted && Func.is.num(animator.loop)) {
               animator.loop *= 2;
            };
            if (isCompleted) {
               if (!animator.isReverse) {
                  animator.isReverse = true;
               } else {
                  animator.isReverse = false;
               }
            };
         };
         if (isCompleted) {
            Func.call(animator.loopComplete, [animator]);
            animator.loopCompleted += 1;
            animator.remaining = typeof animator.loop == 'number' ? animator.loop - animator.loopCompleted : Infinity;
         };
         if (!animator.remaining) {
            return animator
         };
         if (isCompleted || autoplay) {
            Func.call(animator.loopBegin, [params]);
            animator.reset();
            animator.play();
            animator.currentLoop += 1;
         };
         return animator;
      };
      loop(false, animator.autoplay);
      for (let x in animator) {
         this[x] = animator[x];
      };
   };



   // Animating Core

   function removeDuplicates(arr) {
      var newarr = [];

      function check(arr, val) {
         return arr.some((v) => {
            return v.search(Func.get.str(val)[0].replaceAll('(', "")) != -1;
         })
      }
      arr.reverse().forEach((v) => {
         if (!check(newarr, v)) {
            newarr.push(v);
         }
      });
      return newarr;
   };

   function Animater(animations, params, css, loop) {
      for (let x in params) {
         this[x] = params[x];
      };
      params = this;

      function animateTo(time) {
         if (params.isReverse) {
            time = params.duration - time;
         };
         time = Func.minMax(time, 0, params.duration);
         var progress = Func.to.progress(time, params.duration);
         params.currentProgress = progress;
         params.currentTime = time;
         var transforms = [];
         animations.forEach(function(a, i) {
            var propName = a.propName;
            var target = a.target;
            var b1 = {};
            a.tweens.forEach(function(b, i) {
               if (b.valueType == 'transform') {
                  propName = 'transform'
               };
               b1 = b;
               var elapsed = Func.minMax(time - b.start, 0, b.duration);
               var elapsedProgress = Func.to.progress(elapsed, b.duration);
               if (i != 0 && b.start > time) {
                  return;
               };
               var x = elapsedProgress / 100;
               var propValue = calculateValues(b, x);
               if (propName == 'transform') {
                  transforms.push(propValue);
                  transforms = removeDuplicates(transforms);
                  propValue = transforms.join(' ');
               };
               Func.call(params.update, [params]);
               a.currentValue = propValue;
               target[b.animateType](propName, propValue);
            });
         });
      };

      var firstFrame = 0;
      var adjustTime = 0;
      var prevTime = 0;

      function setAnimationsTime(frameTime) {
         if (params.isPaused) {
            return;
         }
         params.fps = (1 / ((frameTime - prevTime) / 1000));
         prevTime = frameTime;
         if (!firstFrame) {
            firstFrame = frameTime;
         };
         var currentTime = (frameTime + (adjustTime - firstFrame)) * params.speed;
         animateTo(currentTime);
         if (currentTime >= params.duration) {
            params.isCompleted = true;
            params.isPaused = true;
            params.isPlaying = false;
            if ((params.direction == 'alternate' && params.isReverse) || params.direction != 'alternate') {
               Func.call(params.complete, [params]);
            };
            loop(true);
            firstFrame = frameTime;
         } else {
            req = window.requestAnimationFrame(setAnimationsTime);
         };
      };
      var req = null;
      params.play = function() {
         if (params.isPlaying) {
            return;
         }
         Func.call(params.begin, [params]);
         req = window.requestAnimationFrame(setAnimationsTime);
         params.isPaused = false;
         params.isPlaying = true;
         params.isCompleted = false;
      };
      params.pause = function() {
         if (params.isPaused) {
            return;
         };
         params.isPaused = true;
         params.isPlaying = false;
         adjustTime = params.currentTime;
         firstFrame = 0;
         req = window.cancelAnimationFrame(req);
      };
      params.seek = function(time) {
         adjustTime = time;
         animateTo(parseFloat(time));
      };
      params.reset = function() {
         firstFrame = 0;
         adjustTime = 0;
         params.isCompleted = false;
         params.currentTime = 0;
      };
      params.replay = function() {
         params.reset();
         params.play();
      };
      params.remove = function(target) {
         if (target) {
            target = Jua(target).toArray();
            var newAnims = [];
            params.animations.forEach(function(v) {
               var t = v.target.node;
               if (target.search(t) == -1) {
                  newAnims.push(v);
               };
            });
            params.animations = newAnims;
         } else {
            params.reset();
            window.cancelAnimationFrame(req);
         };
      };
      return params;
   };


   function calculateValues(b, x, onlyFrom) {
      var fromO = b.from;
      var toO = b.to;
      var ease = b.easingFunc(x);
      var round = b.round;
      var propValue = '';
      var numbers = [];
      var valueType = b.valueType;
      if (onlyFrom) {
         toO = fromO;
      };
      switch (valueType) {
         case 'number':
         case 'string':
         case 'color':
            var fromNumbers = fromO.numbers;
            var toNumbers = toO.numbers;
            toNumbers.forEach(function(c, i) {
               var from = Number(fromNumbers[i] || 0);
               var to = Number(c);
               var diff = to - from;
               var val = from + (diff * ease);
               if (round) {
                  val = Math.round(val * round) / round;
               };
               numbers.push(val);

            });
            var n = 0;
            b.to.strings.forEach(function(d, i) {
               if (d != '') {
                  propValue += d + ' ';
               } else {
                  propValue += numbers[n];
                  n++;
               };
            });
            break;
         case 'transform':
            for (let x in fromO) {
               var fromNumber = fromO[x];
               var toNumber = toO[x];
               var from = Number(fromNumber || 0);
               var to = Number(toNumber);
               var diff = to - from;
               if (diff == 0 || (Func.is.transform(b.propName) ? (x).toLowerCase().search(b.propName.toLowerCase()) == -1 : String(b.value).search(x) == -1)) {
                  continue;
               }
               var val = from + (diff * ease);

               if (round) {
                  val = Math.round(val * round) / round;
               };
               if (!Number.isFinite(val) || (Number.isNaN(val) && !Number.isFinite(to) && !Number.isFinite(from))) {
                  val = 0;
               };
               propValue += x + "(" + val + Func.get.transformUnit(x) + ") ";
            };
            break;
      };
      return propValue;
   };


   // follow Through Animations

   function stagger(val, params) {
      if (params === void 0) params = {};

      var direction = params.direction || 'normal';
      var easing = params.easing ? parseEasings(params.easing).func : null;
      var grid = params.grid;
      var axis = params.axis;
      var fromIndex = params.from || 0;
      var fromFirst = fromIndex === 'start' || fromIndex === 'first';
      var fromCenter = fromIndex === 'middle' || fromIndex === 'center';
      var fromLast = fromIndex === 'end' || fromIndex === 'last';
      var isRange = Func.is.arr(val);
      var val1 = isRange ? parseFloat(val[0]) : parseFloat(val);
      var val2 = isRange ? parseFloat(val[1]) : 0;
      var unit = Func.get.unit(isRange ? val[1] : val) || 0;
      var start = params.start || 0 + (isRange ? val1 : 0);
      var values = [];
      var maxValue = 0;
      return function(el, i, t) {
         if (fromFirst) {
            fromIndex = 0;
         }
         if (fromCenter) {
            fromIndex = (t - 1) / 2;
         }
         if (fromLast) {
            fromIndex = t - 1;
         }
         if (!values.length) {
            for (var index = 0; index < t; index++) {
               if (!grid) {
                  values.push(Math.abs(fromIndex - index));
               } else {
                  var fromX = !fromCenter ? fromIndex % grid[0] : (grid[0] - 1) / 2;
                  var fromY = !fromCenter ? Math.floor(fromIndex / grid[0]) : (grid[1] - 1) / 2;
                  var toX = index % grid[0];
                  var toY = Math.floor(index / grid[0]);
                  var distanceX = fromX - toX;
                  var distanceY = fromY - toY;
                  var value = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                  if (axis === 'x') {
                     value = -distanceX;
                  }
                  if (axis === 'y') {
                     value = -distanceY;
                  }
                  values.push(value);
               }
               maxValue = Math.max.apply(Math, values);
            }
            if (easing) {
               values = values.map(function(val) {
                  return easing(val / maxValue) * maxValue;
               });
            }
            if (direction === 'reverse') {
               values = values.map(function(val) {
                  return axis ? (val < 0) ? val * -1 : -val : Math.abs(maxValue - val);
               });
            }
         }
         var spacing = isRange ? (val2 - val1) / maxValue : val1;
         return start + (spacing * (Math.round(values[i] * 100) / 100)) + unit;
      }
   }

   Jua.stagger = stagger;
};
   /////////////////////////////// animation ////////////////////////
   window.Jua = window._ = window._Jua = window.$ = Jua;
   //////////////
})();