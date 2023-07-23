import { HtmlParser, I18NHtmlParser, Parser, Lexer, CompilerConfig, TemplateParser, DomElementSchemaRegistry, Visitor, Node, Attribute, Element, Expansion, Text, Comment, ExpansionCase, ParseSourceSpan } from '@angular/compiler'

function formatElementName(name: string) {
    return name.replace(/^:svg:/, '');
}

export function format(
    src: string,
    indentation = 2,
    useSpaces = true,
    closeTagSameLine = true,
    groupAttrsByTypes = true,
    firstAttrOnTagLine = true): string {
    const rawHtmlParser = new HtmlParser();
    const htmlParser = new I18NHtmlParser(rawHtmlParser);
    const expressionParser = new Parser(new Lexer());
    const config = new CompilerConfig();
    const parser = new TemplateParser(
        config, expressionParser, new DomElementSchemaRegistry(), htmlParser, null!, []);
    const htmlResult = htmlParser.parse(src, '', true);

    let pretty: string[] = [];
    let indent = 0;
    let attrNewLines = false;

    if(htmlResult.errors && htmlResult.errors.length > 0) {
        return src;
    }

    const predefinedHtmlAttrs = ["accept", "accept-charset", "accesskey", "action", "align", "alt", "async", "autocomplete", "autofocus", "autoplay", "bgcolor", "border", "charset", "checked", "cite", "class", "color", "cols", "colspan", "content", "contenteditable", "controls", "coords", "data", "data-*", "datetime", "default", "defer", "dir", "dirname", "disabled", "download", "draggable", "enctype", "for", "form", "formaction", "headers", "height", "hidden", "high", "href", "hreflang", "http-equiv", "id", "ismap", "kind", "label", "lang", "list", "loop", "low", "max", "maxlength", "media", "method", "min", "multiple", "muted", "name", "novalidate", "onabort", "onafterprint", "onbeforeprint", "onbeforeunload", "onblur", "oncanplay", "oncanplaythrough", "onchange", "onclick", "oncontextmenu", "oncopy", "oncuechange", "oncut", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "onhashchange", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onoffline", "ononline", "onpagehide", "onpageshow", "onpaste", "onpause", "onplay", "onplaying", "onpopstate", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onsearch", "onseeked", "onseeking", "onselect", "onstalled", "onstorage", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onunload", "onvolumechange", "onwaiting", "onwheel", "open", "optimum", "pattern", "placeholder", "poster", "preload", "readonly", "rel", "required", "reversed", "rows", "rowspan", "sandbox", "scope", "selected", "shape", "size", "sizes", "span", "spellcheck", "src", "srcdoc", "srclang", "srcset", "start", "step", "style", "tabindex", "target", "title", "translate", "type", "usemap", "value", "width", "wrap"];
    const predefinedHtmlAttrsSet = new Set(predefinedHtmlAttrs);
    const iikoStyleClassesSet = new Set(['text-gray', 'text-danger', 'text-warning', 'text-primary', 'text-info', 'bold', 'text-underline', 'pointer', 'ellipsis', 'disabled', 'posr', 'no-wrap', 'no-wrap-only', 'bgi', 'f-gr-1', 'd-block', 'justify-center', 'align-items-center', 'drop-padding-and-overflow', 'bg-info', 'mx-auto', 'flex-column', 'items-start', 'flex-row', 'wrap', 'text-center', 'float-right']);
    const iikoStyleClassesRegExp = new RegExp('^[a-zA-Z]{1,2}-{0,1}[0-9]{1,3}[a-zA-Z]{0,1}$');
    const selfClosing = {
        'area': true,
        'base': true,
        'br': true,
        'col': true,
        'command': true,
        'embed': true,
        'hr': true,
        'img': true,
        'input': true,
        'keygen': true,
        'link': true,
        'meta': true,
        'param': true,
        'source': true,
        'track': true,
        'wbr': true,
    };

    const skipFormattingChildren = {
        'style': true,
        'pre': true,
    };

    const detectedDoctype = src.match(/^\s*<!DOCTYPE((.|\n|\r)*?)>/i);

    if (detectedDoctype) {
        pretty.push(detectedDoctype[0].trim());
    }

    let getIndent = (i: number): string => {
        if (useSpaces) {
            return new Array(i * indentation).fill(' ').join('');
        } else {
            return new Array(i).fill('\t').join('');
        }
    }

    function getFromSource(parseLocation:ParseSourceSpan) {
        return parseLocation.start.file.content.substring(parseLocation.start.offset, parseLocation.end.offset);
    }

    function sortAttrubitesByName(attrs: Attribute[]): Attribute[] {
        const result = [...attrs];
        result.sort((a, b) => a.name.localeCompare(b.name));
        return result;
    }

    function sortAndGroupAttributesByTypes(attrs: Attribute[]): Attribute[][] {
        const structuralDirectives: Attribute[] = [];
        const templateVariables: Attribute[] = [];
        const idAttributes: Attribute[] = [];
        const classes: Attribute[] = [];
        const otherDomAttrs: Attribute[] = [];
        const customAttrs: Attribute[] = [];
        const inputs: Attribute[] = [];
        const ngModels: Attribute[] = [];
        const actions: Attribute[] = [];
        attrs.forEach(attr => {
            if (attr.name.indexOf('*') === 0) {
                structuralDirectives.push(attr);
                return;
            }
            if (attr.name.indexOf('#') === 0) {
                templateVariables.push(attr);
                return;
            }
            if (attr.name.indexOf('id') === 0) {
                idAttributes.push(attr);
                return;
            }
            if (attr.name.indexOf('class') === 0) {
                classes.push(attr);
                return;
            }
            if (attr.name.indexOf('(') === 0) {
                actions.push(attr);
                return;
            }
            if (attr.name.indexOf('[(') === 0) {
                ngModels.push(attr);
                return;
            }
            if (attr.name.indexOf('[') === 0) {
                inputs.push(attr);
                return;
            }
            if (predefinedHtmlAttrsSet.has(attr.name)) {
                otherDomAttrs.push(attr);
                return;
            }

            customAttrs.push(attr);
        });

        let group1 = [
            ...sortAttrubitesByName(structuralDirectives),
            ...sortAttrubitesByName(templateVariables)];
        let group2 = [
            ...sortAttrubitesByName(idAttributes),
            ...sortAttrubitesByName(classes),
            ...sortAttrubitesByName(otherDomAttrs)];
        let group3 = [
            ...sortAttrubitesByName(customAttrs)];
        let group4 = [
            ...sortAttrubitesByName(inputs),
            ...sortAttrubitesByName(ngModels)];
        let group5 = [
            ...sortAttrubitesByName(actions)];

        const groups: Attribute[][] = [];
        if (group5.length <= 1) {
            group4 = [...group4, ...group5];
            group5 = [];
        }
        if (group4.length <= 1) {
            group3 = [...group3, ...group4];
            group4 = [];
        }
        if (group3.length <= 1) {
            group2 = [...group2, ...group3];
            group3 = [];
        }
        if (group2.length <= 1) {
            group1 = [...group1, ...group2];
            group2 = [];
        }

        if (group1.length > 0) {
            groups.push(group1);
        }
        if (group2.length > 0) {
            groups.push(group2);
        }
        if (group3.length > 0) {
            groups.push(group3);
        }
        if (group4.length > 0) {
            groups.push(group4);
        }
        if (group5.length > 0) {
            groups.push(group5);
        }

        if (groups.length === 2) {
            return [[...groups[0], ...groups[1]]];
        }

        return groups;
    }

    function sortClassNames(classNamesStr: string): string {
        if(!classNamesStr){
            return;
        }

        const iikoStyleLongNames: string[] = [];
        const iikoStyleShortNames: string[] = [];
        const others: string[] = [];

        const classNames = classNamesStr
        .replace(new RegExp('\r\n', 'g'), ' ')
        .replace(new RegExp('\n', 'g'), ' ')
        .replace(new RegExp('[ ]{1,}', 'g'), ' ')
        .trim()
        .split(' ');

        classNames.forEach(className => {
            if(iikoStyleClassesSet.has(className)) {
                iikoStyleLongNames.push(className);
                return;
            }
            if(iikoStyleClassesRegExp.exec(className)) {
                iikoStyleShortNames.push(className);
                return;
            }
            others.push(className);
        });

        others.sort();
        iikoStyleLongNames.sort();
        iikoStyleShortNames.sort();

        return [...others, ...iikoStyleLongNames, ...iikoStyleShortNames].join(' ');
    }

    function collapseAngularStatement(text: string): string {

        const regExps = [
            new RegExp("^\{\{( ){0,}(\\r\\n){0,1}(?<expr>.*)(\\r\\n)( ){0,}\}\}$"),
            new RegExp("^\{\{( ){0,}(\\r\\n){0,1}(?<expr>.*)( ){0,}\}\}$")
        ];
        for(const regExp of regExps) {
            const result: any = regExp.exec(text);
            if(result && result.groups && result.groups.expr){
                const statement = result.groups.expr.trim();
                return `{{${statement}}}`;
            }
        }

        return text;
    }

    let visitor: Visitor = {
        visitElement: function (element) {
            if (pretty.length > 0) {
                pretty.push('\n');
            }
            const formattedElName = formatElementName(element.name);
            pretty.push(getIndent(indent) + '<' + formatElementName(element.name));
            attrNewLines = element.attrs.length > 1 && element.name != 'link';
            const elemAttrGroups = sortAndGroupAttributesByTypes(element.attrs);
            elemAttrGroups.forEach((attrGroup: Attribute[], groupIndex: number) => {
                if (groupIndex !== 0 && groupAttrsByTypes) {
                    pretty.push('\n');
                }
                attrGroup.forEach((attr: Attribute, attrIndex: number) => {
                    attr.visit(visitor, { 
                        firstAttr: groupIndex === 0 && attrIndex === 0,
                        tagIdentLength: formattedElName.length + 2
                    });
                });
            });
            if (!closeTagSameLine && attrNewLines) {
                pretty.push('\n' + getIndent(indent));
            }
            pretty.push('>');
            indent++;
            let ctx = {
                inlineTextNode: false,
                textNodeInlined: false,
                skipFormattingChildren: skipFormattingChildren.hasOwnProperty(element.name),
            };
            if (!attrNewLines 
                && element.children.length == 1 
                && !closeTagSameLine) {
                ctx.inlineTextNode = true;
            }
            element.children.forEach(element => {
                element.visit(visitor, ctx);
            });
            indent--;
            if (element.children.length > 0 && !ctx.textNodeInlined && !ctx.skipFormattingChildren) {
                pretty.push('\n' + getIndent(indent));
            }
            if (!selfClosing.hasOwnProperty(element.name)) {
                pretty.push(`</${formatElementName(element.name)}>`);
            }
        },
        visit: function (node: Node, context: any) {
            console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED')
        },
        visitAttribute: function (attribute: Attribute, context: any) {
            let { firstAttr, tagIdentLength } = context;
            const identStr = firstAttrOnTagLine
                ? getIndent(indent) + new Array(tagIdentLength).fill(' ').join('')
                : getIndent(indent + 1);
            let prefix = !attrNewLines || firstAttrOnTagLine && firstAttr
                ? ' '
                : '\n' + identStr;
            pretty.push(prefix + attribute.name);
            if (attribute.value.length) {
                let value = attribute.name === 'class'
                    ? `"${sortClassNames(attribute.value)}"`
                    : getFromSource(attribute.valueSpan);
                pretty.push(`=${value.trim()}`);
            }
        },
        visitComment: function (comment: Comment, context: any) {
            pretty.push('\n' + getIndent(indent) + '<!-- ' + comment.value.trim() + ' -->');
        },
        visitExpansion: function (expansion: Expansion, context: any) {
            console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED')
        },
        visitExpansionCase: function (expansionCase: ExpansionCase, context: any) {
            console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED')
        },
        visitText: function (text: Text, context: any) {
            let value = getFromSource(text.sourceSpan);
            if (context.skipFormattingChildren) {
                pretty.push(value);
                return;
            }

            value = collapseAngularStatement(value);

            let shouldInline = context.inlineTextNode && value.trim().length < 40 &&
                value.trim().length + pretty[pretty.length - 1].length < 140;

            context.textNodeInlined = shouldInline;
            if (value.trim().length > 0) {
                let prefix = shouldInline ? '' : '\n' + getIndent(indent);
                pretty.push(prefix + value.trim());
            } else if (!shouldInline) {                
                pretty.push(value
                    .replace(new RegExp('\r\n'), '')
                    .replace(new RegExp('(?<!\r)\n'), '')
                    .replace(/ /g, '')
                    .replace(/\t/g, ''));
            }
        }
    }

    htmlResult.rootNodes.forEach(node => {
        node.visit(visitor, {});
    })

    return pretty.join('').trim() + '\n';
}