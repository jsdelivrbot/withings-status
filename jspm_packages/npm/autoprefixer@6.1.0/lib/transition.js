/* */ 
(function() {
  var Transition, parser, vendor;

  parser = require('postcss-value-parser');

  vendor = require('postcss/lib/vendor');

  Transition = (function() {
    function Transition(prefixes) {
      this.prefixes = prefixes;
    }

    Transition.prototype.props = ['transition', 'transition-property'];

    Transition.prototype.add = function(decl) {
      var added, clean, declPrefixes, j, k, l, len, len1, len2, names, param, params, prefix, prefixValue, prefixed, prefixer, prop, ref, ref1, value;
      declPrefixes = ((ref = this.prefixes.add[decl.prop]) != null ? ref.prefixes : void 0) || [];
      params = this.parse(decl.value);
      names = params.map(function(i) {
        return i[0].value;
      });
      added = [];
      if (names.some(function(i) {
        return i[0] === '-';
      })) {
        return;
      }
      for (j = 0, len = params.length; j < len; j++) {
        param = params[j];
        prop = param[0].value;
        if (prop[0] === '-') {
          continue;
        }
        prefixer = this.prefixes.add[prop];
        if (!(prefixer != null ? prefixer.prefixes : void 0)) {
          continue;
        }
        ref1 = prefixer.prefixes;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          prefix = ref1[k];
          prefixed = this.prefixes.prefixed(prop, prefix);
          if (prefixed !== '-ms-transform' && names.indexOf(prefixed) === -1) {
            added.push(this.clone(prefixed, param));
          }
        }
      }
      params = params.concat(added);
      value = this.stringify(params);
      clean = this.stringify(this.cleanForSafari(params));
      if (declPrefixes.indexOf('-webkit-') !== -1) {
        this.cloneBefore(decl, '-webkit-' + decl.prop, clean);
      }
      this.cloneBefore(decl, decl.prop, clean);
      for (l = 0, len2 = declPrefixes.length; l < len2; l++) {
        prefix = declPrefixes[l];
        if (prefix !== '-webkit-') {
          prefixValue = this.stringify(this.cleanOtherPrefixes(params, prefix));
          this.cloneBefore(decl, prefix + decl.prop, prefixValue);
        }
      }
      if (value !== decl.value && !this.already(decl, decl.prop, value)) {
        decl.cloneBefore();
        return decl.value = value;
      }
    };

    Transition.prototype.already = function(decl, prop, value) {
      return decl.parent.some(function(i) {
        return i.prop === prop && i.value === value;
      });
    };

    Transition.prototype.cloneBefore = function(decl, prop, value) {
      if (!this.already(decl, prop, value)) {
        return decl.cloneBefore({
          prop: prop,
          value: value
        });
      }
    };

    Transition.prototype.remove = function(decl) {
      var double, params, smaller, value;
      params = this.parse(decl.value);
      params = params.filter((function(_this) {
        return function(param) {
          var ref;
          return !((ref = _this.prefixes.remove[param[0].value]) != null ? ref.remove : void 0);
        };
      })(this));
      value = this.stringify(params);
      if (decl.value === value) {
        return;
      }
      if (params.length === 0) {
        decl.remove();
        return;
      }
      double = decl.parent.some(function(i) {
        return i.prop === decl.prop && i.value === value;
      });
      smaller = decl.parent.some(function(i) {
        return i !== decl && i.prop === decl.prop && i.value.length > value.length;
      });
      if (double || smaller) {
        return decl.remove();
      } else {
        return decl.value = value;
      }
    };

    Transition.prototype.parse = function(value) {
      var ast, j, len, node, param, ref, result;
      ast = parser(value);
      result = [];
      param = [];
      ref = ast.nodes;
      for (j = 0, len = ref.length; j < len; j++) {
        node = ref[j];
        param.push(node);
        if (node.type === 'div' && node.value === ',') {
          result.push(param);
          param = [];
        }
      }
      result.push(param);
      return result;
    };

    Transition.prototype.stringify = function(params) {
      var j, len, nodes, param;
      if (params.length === 0) {
        return '';
      }
      nodes = [];
      for (j = 0, len = params.length; j < len; j++) {
        param = params[j];
        if (param[param.length - 1].type !== 'div') {
          param.push(this.div(params));
        }
        nodes = nodes.concat(param);
      }
      if (nodes[0].type === 'div') {
        nodes = nodes.slice(1);
      }
      if (nodes[nodes.length - 1].type === 'div') {
        nodes = nodes.slice(0, -1);
      }
      return parser.stringify({
        nodes: nodes
      });
    };

    Transition.prototype.clone = function(name, param) {
      var i, j, len, result;
      result = [];
      for (j = 0, len = param.length; j < len; j++) {
        i = param[j];
        result.push(i);
      }
      result[0] = {
        type: 'word',
        value: name
      };
      return result;
    };

    Transition.prototype.div = function(params) {
      var j, k, len, len1, node, param;
      for (j = 0, len = params.length; j < len; j++) {
        param = params[j];
        for (k = 0, len1 = param.length; k < len1; k++) {
          node = param[k];
          if (node.type === 'div' && node.value === ',') {
            return node;
          }
        }
      }
      return {
        type: 'div',
        value: ',',
        after: ' '
      };
    };

    Transition.prototype.cleanOtherPrefixes = function(params, prefix) {
      return params.filter(function(param) {
        var current;
        current = vendor.prefix(param[0].value);
        return current === '' || current === prefix;
      });
    };

    Transition.prototype.cleanForSafari = function(params) {
      var j, len, param, prefix, prop, remove, result;
      result = [];
      remove = params.map(function(i) {
        return i[0].value;
      }).filter(function(i) {
        return i.slice(0, 8) === '-webkit-';
      }).map((function(_this) {
        return function(i) {
          return _this.prefixes.unprefixed(i);
        };
      })(this));
      for (j = 0, len = params.length; j < len; j++) {
        param = params[j];
        prop = param[0].value;
        prefix = vendor.prefix(prop);
        if (remove.indexOf(prop) === -1 && (prefix === '-webkit-' || prefix === '')) {
          result.push(param);
        }
      }
      return result;
    };

    return Transition;

  })();

  module.exports = Transition;

}).call(this);
