macro member {
    rule { $mName($mArgs(,)...){$mBody...} }
    rule { static $mName($mArgs(,)...){$mBody...} }
    rule { static $pName = $pBody... }
    rule { set $mName($mArgs(,)...){$mBody...} }
    rule { get $mName($mArgs(,)...){$mBody...} }
    rule { static set $mName($mArgs(,)...){$mBody...} }
    rule { static get $mName($mArgs(,)...){$mBody...} }

    case { _ $syntax } => { 
        var syntax = #{$syntax};

        throwSyntaxError('class', 'class is not correctly defined', syntax);
    }
}

macro class {   
    case { _ $className { $cBody:member...} } => {        
        var parts = #{$cBody...};
        var sClassName = makeIdent(unwrapSyntax(#{$className}), #{$className});
        var subparts;
        var constructor;
        var name, value;
        var output = [];
        var classProperties = {};
        var protoProperties = {};
        var n = 0, l = parts.length;

        function addSyntax() {
            Array.prototype.push.apply(output, arguments);
        }

        function addProperties(properties) {
            var name, key;

             for (name in properties) {
                addSyntax(
                    makeIdent('Object.defineProperty', null),
                    makePunc('(', null),
                    sClassName
                );
                
                if (properties === protoProperties) {
                    addSyntax(
                        makePunc('.', null),
                        makeIdent('prototype', null)
                    );
                }
                addSyntax(
                    makePunc(',', null),
                    makeValue(name, null),
                    makePunc(',', null),               
                    makePunc('{', null),
                    makeIdent('configurable', null),
                    makePunc(':', null),
                    makeValue(true, null),
                    makePunc(',', null)
                );
                for (key in properties[name]) {
                    if (properties[name][key][0].token.value === '=') {
                        addSyntax(
                            makeIdent('value', null),
                            makePunc(':', null),
                            properties[name][key][1],
                            makePunc(',', null)
                        );
                    } else {
                        addSyntax(
                            makeIdent(key, null),
                            makePunc(':', null),
                            makeKeyword('function', null),
                            properties[name][key][0],
                            properties[name][key][1],
                            makePunc(',', null)
                        );
                    }
                }
                addSyntax(
                    makePunc('}', null),
                    makePunc(')', null),
                    makePunc(';', null)
                );
            }    
        }   

        while (n < l) {
            value = parts[n] && parts[n].token ? parts[n].token.value : null

            if (value === 'constructor') {
                if (constructor) {
                    throwSyntaxError('class', 'A class may only have one constructor', parts[n]);
                }
                constructor = [makeKeyword('function', null), sClassName,  parts[++n], parts[++n]];
            } else if (value === 'static' && parts[n + 1].token && parts[n + 1].token.type === parser.Token.Identifier) {
                subparts = [parts[++n], parts[++n], parts[++n]];                    

                if (subparts[0] && (subparts[0].token.value === 'get' || subparts[0].token.value === 'set')) {
                    subparts.push(parts[++n]);
                    name = subparts[1].token.value;
                    classProperties[name] = classProperties[name] || {};
                    classProperties[name][subparts[0].token.value] = [subparts[2], subparts[3]];
                } else { 
                    if (subparts[1] && subparts[1].token.value === '=' && parts[n + 1] && parts[n + 1].token.value === ';') {
                        n++;
                    }                       
                    name = subparts[0].token.value;
                    classProperties[name] = classProperties[name] || {};
                    classProperties[name]['value'] = [subparts[1], subparts[2]];
                }
           } else if ((value === 'get' || value === 'set') && parts[n + 1].token && parts[n + 1].token.type === parser.Token.Identifier) {
               subparts = [parts[++n], parts[++n], parts[++n]];
               name = subparts[0].token.value;
               protoProperties[name] = protoProperties[name] || {};
               protoProperties[name][value] = [subparts[1], subparts[2]];             
           } else {
                addSyntax(
                    sClassName,
                    makePunc('.', null),
                    makeIdent('prototype', null),
                    makePunc('.', null),
                    parts[n],
                    makePunc('=', null),
                    makeKeyword('function', null),
                    parts[++n],
                    parts[++n],                        
                    makePunc(';', null)
                );
            }
            n++;
        }

        if (!constructor) {
            constructor = [
                makeKeyword('function', null),
                sClassName,
                makeDelim('()',[], null),
                makeDelim('{}',[], null)
            ];
        }

        Array.prototype.unshift.apply(output, constructor);
        addProperties(classProperties);
        addProperties(protoProperties);

        return output;
    }
    
case { _ $className extends $pClassName { $cBody:member...} } => {
        var parts = #{$cBody...};
        var classCode = #{ 
            $className.prototype = Object.create($pClassName.prototype);
            var properties = Object.getOwnPropertyNames($pClassName);
            for (var n = 0, l = properties.length; n < l; n++) {
                var property = properties[n];
                if (!$className.hasOwnProperty(property)) {
                    Object.defineProperty($className, property, Object.getOwnPropertyDescriptor($pClassName, property));
                }
            }
            $className.prototype.constructor = $className;
        }        
        var defaultConstructor = #{ function $className() { $pClassName.apply(this, arguments); } }
        var sClassName = makeIdent(unwrapSyntax(#{$className}), #{$className});        
        var pClassName = unwrapSyntax(#{$pClassName});
        var spClassName = makeIdent(spClassName, #{$plassName});
        var methodName;
        var subparts;
        var constructor;
        var name, value;
        var output = [];
        var classProperties = {};
        var protoProperties = {};
        var definitions ={};
        var n = 0, l = parts.length;

        function addSyntax() {
            Array.prototype.push.apply(output, arguments);
        }

        function addProperties(properties) {
            var name, key;
            
            for (name in properties) {
                addSyntax(
                    makeIdent('Object.defineProperty', null),
                    makePunc('(', null),
                    sClassName
                );

                if (properties === protoProperties) {
                    addSyntax(
                        makePunc('.', null),
                        makeIdent('prototype', null)
                    );
                }
                addSyntax(
                    makePunc(',', null),
                    makeValue(name, null),
                    makePunc(',', null),               
                    makePunc('{', null),
                    makeIdent('configurable', null),
                    makePunc(':', null),
                    makeValue(true, null),
                    makePunc(',', null)                    
                );
                for (key in properties[name]) {
                    if (properties[name][key][0].token.value === '=') {
                        addSyntax(
                            makeIdent('value', null),
                            makePunc(':', null),
                            properties[name][key][1],
                            makePunc(',', null)
                        );
                    } else {
                        addSyntax(
                            makeIdent(key, null),
                            makePunc(':', null),
                            makeKeyword('function', null),
                            properties[name][key][0],
                            properties[name][key][1],
                            makePunc(',', null)
                        );
                    }
                }
                addSyntax(
                    makePunc('}', null),
                    makePunc(')', null),
                    makePunc(';', null)
                );
            }    
        }           

        function processSuper(syntax, static) {
            var n, l, originalSyntax, parentCall;
            
            if (syntax instanceof Array) {
                n = 0;
                l = syntax.length;

                while (n < l) {                
                    if (syntax[n].token.value === 'super') {           
                        originalSyntax = syntax[n];
                        if (syntax[n + 1].token.value === '.' && syntax[n + 2].token.type === parser.Token.Identifier) {
                            methodName = syntax[n + 2].token.value;
                            syntax[n] = static ? makeIdent(pClassName + '.' + methodName + '.call', originalSyntax) : 
                                                 makeIdent(pClassName + '.prototype.' + methodName + '.call', originalSyntax);
                            syntax.splice(n + 1, 2); 
                        } else {
                            syntax[n] = makeIdent(pClassName + '.call', originalSyntax);    
                        }

                        originalSyntax = syntax[++n];      
                        if (originalSyntax.token.inner.length > 0) {
                            originalSyntax.token.inner.unshift(makePunc(',', originalSyntax));                        
                        }
                        originalSyntax.token.inner.unshift(makeIdent('this', originalSyntax));                            
                        break;
                    } else if (syntax[n].token && syntax[n].token.inner) {
                        processSuper(syntax[n].token.inner, static);
                    }
                    n++;
                }
            } else if (syntax.token && syntax.token.inner) {                        
                processSuper(syntax.token.inner, static);
            }
            
            return syntax;
        }
        
        while (n < l) {
            value = parts[n] && parts[n].token ? parts[n].token.value : null;

            if (value === 'constructor') {
                if (constructor) {
                    throwSyntaxError('class', 'A class may only have one constructor', parts[n]);
                }
                constructor = [makeKeyword('function', null), sClassName,  parts[++n], processSuper(parts[++n], false)];
            } else if (value === 'static' && parts[n + 1].token && parts[n + 1].token.type === parser.Token.Identifier) {
                    subparts = [parts[++n], parts[++n], parts[++n]];

                    if (subparts[0] && (subparts[0].token.value === 'get' || subparts[0].token.value === 'set')) {
                        subparts.push(parts[++n]);
                        name = subparts[1].token.value;
                        classProperties[name] = classProperties[name] || {};
                        classProperties[name][subparts[0].token.value] = [subparts[2], processSuper(subparts[3], true)];
                    } else {     
                        if (subparts[1] && subparts[1].token.value === '=' && parts[n + 1] && parts[n + 1].token.value === ';') {
                            n++;
                        }                          
                        name = subparts[0].token.value;
                        classProperties[name] = classProperties[name] || {};
                        classProperties[name]['value'] = [subparts[1], processSuper(subparts[2], true)];                  
                    }
           } else if ((value === 'get' || value === 'set') && parts[n + 1].token && parts[n + 1].token.type === parser.Token.Identifier) {
               subparts = [parts[++n], parts[++n], parts[++n]];
               name = subparts[0].token.value;
               protoProperties[name] = protoProperties[name] || {};
               protoProperties[name][value] = [subparts[1], processSuper(subparts[2])];                  
           } else {
                addSyntax(
                    sClassName,
                    makePunc('.', null),
                    makeIdent('prototype', null),
                    makePunc('.', null),
                    parts[n],
                    makePunc('=', null),
                    makeKeyword('function', null),
                    parts[++n],
                    processSuper(parts[++n], false),
                    makePunc(';', null)
                );
            }
            n++;
        }

        if (!constructor) {
            constructor = defaultConstructor;
        }

        Array.prototype.push.apply(constructor, classCode);
        Array.prototype.unshift.apply(output, constructor);

        addProperties(classProperties);
        addProperties(protoProperties);   

        return output;
    }        
}

export class;
