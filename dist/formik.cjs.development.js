'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var React = require('react');
var isEqual = _interopDefault(require('react-fast-compare'));
var deepmerge = _interopDefault(require('deepmerge'));
var hoistNonReactStatics = _interopDefault(require('hoist-non-react-statics'));
var createContext = _interopDefault(require('create-react-context'));
var warning = _interopDefault(require('tiny-warning'));
var get = _interopDefault(require('lodash/get'));
var cloneDeep = _interopDefault(require('lodash/cloneDeep'));
var toPath = _interopDefault(require('lodash/toPath'));

var _a;
var FormikProvider = (_a = createContext({}), _a.Provider), FormikConsumer = _a.Consumer;
function connect(Comp) {
    var C = function (props) { return (React.createElement(FormikConsumer, null, function (formik) { return React.createElement(Comp, tslib_1.__assign({}, props, { formik: formik })); })); };
    var componentDisplayName = Comp.displayName ||
        Comp.name ||
        (Comp.constructor && Comp.constructor.name) ||
        'Component';
    C.WrappedComponent = Comp;
    C.displayName = "FormikConnect(" + componentDisplayName + ")";
    return hoistNonReactStatics(C, Comp);
}

function getIn(obj, key, def, p) {
    if (p === void 0) { p = 0; }
    var path = toPath(key);
    while (obj && p < path.length) {
        obj = obj[path[p++]];
    }
    return obj === undefined ? def : obj;
}
function setIn(obj, path, value) {
    var res = {};
    var resVal = res;
    var i = 0;
    var pathArray = toPath(path);
    for (; i < pathArray.length - 1; i++) {
        var currentPath = pathArray[i];
        var currentObj = getIn(obj, pathArray.slice(0, i + 1));
        if (resVal[currentPath]) {
            resVal = resVal[currentPath];
        }
        else if (currentObj) {
            resVal = resVal[currentPath] = cloneDeep(currentObj);
        }
        else {
            var nextPath = pathArray[i + 1];
            resVal = resVal[currentPath] =
                isInteger(nextPath) && Number(nextPath) >= 0 ? [] : {};
        }
    }
    if ((i === 0 ? obj : resVal)[pathArray[i]] === value) {
        return obj;
    }
    if (value === undefined) {
        delete resVal[pathArray[i]];
    }
    else {
        resVal[pathArray[i]] = value;
    }
    var result = tslib_1.__assign({}, obj, res);
    if (i === 0 && value === undefined) {
        delete result[pathArray[i]];
    }
    return result;
}
function setNestedObjectValues(object, value, visited, response) {
    if (visited === void 0) { visited = new WeakMap(); }
    if (response === void 0) { response = {}; }
    for (var _i = 0, _a = Object.keys(object); _i < _a.length; _i++) {
        var k = _a[_i];
        var val = object[k];
        if (isObject(val)) {
            if (!visited.get(val)) {
                visited.set(val, true);
                response[k] = Array.isArray(val) ? [] : {};
                setNestedObjectValues(val, value, visited, response[k]);
            }
        }
        else {
            response[k] = value;
        }
    }
    return response;
}
var isFunction = function (obj) {
    return typeof obj === 'function';
};
var isObject = function (obj) {
    return obj !== null && typeof obj === 'object';
};
var isInteger = function (obj) {
    return String(Math.floor(Number(obj))) === obj;
};
var isString = function (obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};
var isNaN = function (obj) { return obj !== obj; };
var isEmptyChildren = function (children) {
    return React.Children.count(children) === 0;
};
var isPromise = function (value) {
    return isObject(value) && isFunction(value.then);
};
var isInputEvent = function (value) {
    return value && isObject(value) && isObject(value.target);
};
function getActiveElement(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : undefined);
    if (typeof doc === 'undefined') {
        return null;
    }
    try {
        return doc.activeElement || doc.body;
    }
    catch (e) {
        return doc.body;
    }
}
function makeCancelable(promise) {
    var hasCanceled = false;
    var wrappedPromise = new Promise(function (resolve, reject) {
        promise.then(function (val) { return (hasCanceled ? reject({ isCanceled: true }) : resolve(val)); }, function (error) { return (hasCanceled ? reject({ isCanceled: true }) : reject(error)); });
    });
    return [
        wrappedPromise,
        function cancel() {
            hasCanceled = true;
        },
    ];
}

var Formik = (function (_super) {
    tslib_1.__extends(Formik, _super);
    function Formik(props) {
        var _this = _super.call(this, props) || this;
        _this.hcCache = {};
        _this.hbCache = {};
        _this.registerField = function (name, Comp) {
            _this.fields[name] = Comp;
        };
        _this.unregisterField = function (name) {
            delete _this.fields[name];
        };
        _this.setErrors = function (errors) {
            _this.setState({ errors: errors });
        };
        _this.setTouched = function (touched) {
            _this.setState({ touched: touched }, function () {
                if (_this.props.validateOnBlur) {
                    _this.runValidations(_this.state.values);
                }
            });
        };
        _this.setValues = function (values) {
            _this.setState({ values: values }, function () {
                if (_this.props.validateOnChange) {
                    _this.runValidations(values);
                }
            });
        };
        _this.setStatus = function (status) {
            _this.setState({ status: status });
        };
        _this.setError = function (error) {
            {
                console.warn("Warning: Formik's setError(error) is deprecated and may be removed in future releases. Please use Formik's setStatus(status) instead. It works identically. For more info see https://github.com/jaredpalmer/formik#setstatus-status-any--void");
            }
            _this.setState({ error: error });
        };
        _this.setSubmitting = function (isSubmitting) {
            if (_this.didMount) {
                _this.setState({ isSubmitting: isSubmitting });
            }
        };
        _this.validateField = function (field) {
            _this.setState({ isValidating: true });
            return _this.runSingleFieldLevelValidation(field, getIn(_this.state.values, field)).then(function (error) {
                if (_this.didMount) {
                    _this.setState({
                        errors: setIn(_this.state.errors, field, error),
                        isValidating: false,
                    });
                }
                return error;
            });
        };
        _this.runSingleFieldLevelValidation = function (field, value) {
            return new Promise(function (resolve) {
                return resolve(_this.fields[field].props.validate(value));
            }).then(function (x) { return x; }, function (e) { return e; });
        };
        _this.runValidationSchema = function (values) {
            return new Promise(function (resolve) {
                var validationSchema = _this.props.validationSchema;
                var schema = isFunction(validationSchema)
                    ? validationSchema()
                    : validationSchema;
                validateYupSchema(values, schema).then(function () {
                    resolve({});
                }, function (err) {
                    resolve(yupToFormErrors(err));
                });
            });
        };
        _this.runValidations = function (values) {
            if (values === void 0) { values = _this.state.values; }
            if (_this.validator) {
                _this.validator();
            }
            var _a = makeCancelable(Promise.all([
                _this.runFieldLevelValidations(values),
                _this.props.validationSchema ? _this.runValidationSchema(values) : {},
                _this.props.validate ? _this.runValidateHandler(values) : {},
            ]).then(function (_a) {
                var fieldErrors = _a[0], schemaErrors = _a[1], handlerErrors = _a[2];
                return deepmerge.all([fieldErrors, schemaErrors, handlerErrors], { arrayMerge: arrayMerge });
            })), promise = _a[0], cancel = _a[1];
            _this.validator = cancel;
            return promise
                .then(function (errors) {
                if (_this.didMount) {
                    _this.setState(function (prevState) {
                        if (!isEqual(prevState.errors, errors)) {
                            return { errors: errors };
                        }
                        return null;
                    });
                }
                return errors;
            })
                .catch(function (x) { return x; });
        };
        _this.handleChange = function (eventOrPath) {
            var executeChange = function (eventOrValue, maybePath) {
                var field = maybePath;
                var value;
                if (isInputEvent(eventOrValue)) {
                    var event_1 = eventOrValue;
                    if (event_1.persist) {
                        event_1.persist();
                    }
                    var _a = event_1.target, type = _a.type, name_1 = _a.name, id = _a.id, checked = _a.checked, outerHTML = _a.outerHTML;
                    field = maybePath ? maybePath : name_1 ? name_1 : id;
                    if (!field && "development" !== 'production') {
                        warnAboutMissingIdentifier({
                            htmlContent: outerHTML,
                            documentationAnchorLink: 'handlechange-e-reactchangeeventany--void',
                            handlerName: 'handleChange',
                        });
                    }
                    value = event_1.target.value;
                    if (/number|range/.test(type)) {
                        var parsed = parseFloat(event_1.target.value);
                        value = isNaN(parsed) ? '' : parsed;
                    }
                    if (/checkbox/.test(type)) {
                        value = checked;
                    }
                }
                else {
                    value = eventOrValue;
                }
                if (field) {
                    _this.setState(function (prevState) { return (tslib_1.__assign({}, prevState, { values: setIn(prevState.values, field, value) })); }, function () {
                        if (_this.props.validateOnChange) {
                            _this.runValidations(setIn(_this.state.values, field, value));
                        }
                    });
                }
            };
            if (isString(eventOrPath)) {
                var path_1 = eventOrPath;
                if (!isFunction(_this.hcCache[path_1])) {
                    _this.hcCache[path_1] = function (eventOrValue) {
                        return executeChange(eventOrValue, path_1);
                    };
                }
                return _this.hcCache[path_1];
            }
            else {
                var event_2 = eventOrPath;
                executeChange(event_2);
            }
        };
        _this.setFieldValue = function (field, value, shouldValidate) {
            if (shouldValidate === void 0) { shouldValidate = true; }
            if (_this.didMount) {
                _this.setState(function (prevState) { return (tslib_1.__assign({}, prevState, { values: setIn(prevState.values, field, value) })); }, function () {
                    if (_this.props.validateOnChange && shouldValidate) {
                        _this.runValidations(_this.state.values);
                    }
                });
            }
        };
        _this.handleSubmit = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            if (typeof document !== 'undefined') {
                var activeElement = getActiveElement();
                if (activeElement !== null &&
                    activeElement instanceof HTMLButtonElement) {
                    warning(!!(activeElement.attributes &&
                        activeElement.attributes.getNamedItem('type')), 'You submitted a Formik form using a button with an unspecified `type` attribute.  Most browsers default button elements to `type="submit"`. If this is not a submit button, please add `type="button"`.');
                }
            }
            _this.submitForm();
        };
        _this.submitForm = function () {
            _this.setState(function (prevState) { return ({
                touched: setNestedObjectValues(prevState.values, true),
                isSubmitting: true,
                isValidating: true,
                submitCount: prevState.submitCount + 1,
            }); });
            return _this.runValidations(_this.state.values).then(function (combinedErrors) {
                if (_this.didMount) {
                    _this.setState({ isValidating: false });
                }
                var isValid = Object.keys(combinedErrors).length === 0;
                if (isValid) {
                    _this.executeSubmit();
                }
                else if (_this.didMount) {
                    _this.setState({ isSubmitting: false });
                }
            });
        };
        _this.executeSubmit = function () {
            _this.props.onSubmit(_this.state.values, _this.getFormikActions());
        };
        _this.handleBlur = function (eventOrPath) {
            var executeBlur = function (maybeEvent, maybePath) {
                var field = maybePath;
                if (isInputEvent(maybeEvent)) {
                    var event_3 = maybeEvent;
                    if (event_3.persist) {
                        event_3.persist();
                    }
                    var _a = event_3.target, name_2 = _a.name, id = _a.id, outerHTML = _a.outerHTML;
                    field = name_2 ? name_2 : id;
                    if (!field && "development" !== 'production') {
                        warnAboutMissingIdentifier({
                            htmlContent: outerHTML,
                            documentationAnchorLink: 'handleblur-e-reactfocuseventany--void',
                            handlerName: 'handleBlur',
                        });
                    }
                }
                _this.setState(function (prevState) { return ({
                    touched: setIn(prevState.touched, field, true),
                }); });
                if (_this.props.validateOnBlur) {
                    _this.runValidations(_this.state.values).then(function (combinedErrors) {
                        if (_this.props.onBlur && field) {
                            _this.props.onBlur(field, !get(combinedErrors, field));
                        }
                    });
                }
            };
            if (isString(eventOrPath)) {
                var path_2 = eventOrPath;
                if (!isFunction(_this.hbCache[path_2])) {
                    _this.hbCache[path_2] = function (event) {
                        return executeBlur(event, path_2);
                    };
                }
                return _this.hbCache[path_2];
            }
            else {
                var event_4 = eventOrPath;
                executeBlur(event_4);
            }
        };
        _this.setFieldTouched = function (field, touched, shouldValidate) {
            if (touched === void 0) { touched = true; }
            if (shouldValidate === void 0) { shouldValidate = true; }
            _this.setState(function (prevState) { return (tslib_1.__assign({}, prevState, { touched: setIn(prevState.touched, field, touched) })); }, function () {
                if (_this.props.validateOnBlur && shouldValidate) {
                    _this.runValidations(_this.state.values);
                }
            });
        };
        _this.setFieldError = function (field, message) {
            _this.setState(function (prevState) { return (tslib_1.__assign({}, prevState, { errors: setIn(prevState.errors, field, message) })); });
        };
        _this.resetForm = function (nextValues) {
            var values = nextValues ? nextValues : _this.props.initialValues;
            _this.initialValues = values;
            _this.setState({
                isSubmitting: false,
                isValidating: false,
                errors: {},
                touched: {},
                error: undefined,
                status: _this.props.initialStatus,
                values: values,
                submitCount: 0,
            });
        };
        _this.handleReset = function () {
            if (_this.props.onReset) {
                var maybePromisedOnReset = _this.props.onReset(_this.state.values, _this.getFormikActions());
                if (isPromise(maybePromisedOnReset)) {
                    maybePromisedOnReset.then(_this.resetForm);
                }
                else {
                    _this.resetForm();
                }
            }
            else {
                _this.resetForm();
            }
        };
        _this.setFormikState = function (s, callback) {
            return _this.setState(s, callback);
        };
        _this.validateForm = function (values) {
            _this.setState({ isValidating: true });
            return _this.runValidations(values).then(function (errors) {
                if (_this.didMount) {
                    _this.setState({ isValidating: false });
                }
                return errors;
            });
        };
        _this.getFormikActions = function () {
            return {
                resetForm: _this.resetForm,
                submitForm: _this.submitForm,
                validateForm: _this.validateForm,
                validateField: _this.validateField,
                setError: _this.setError,
                setErrors: _this.setErrors,
                setFieldError: _this.setFieldError,
                setFieldTouched: _this.setFieldTouched,
                setFieldValue: _this.setFieldValue,
                setStatus: _this.setStatus,
                setSubmitting: _this.setSubmitting,
                setTouched: _this.setTouched,
                setValues: _this.setValues,
                setFormikState: _this.setFormikState,
            };
        };
        _this.getFormikComputedProps = function () {
            var isInitialValid = _this.props.isInitialValid;
            var dirty = !isEqual(_this.initialValues, _this.state.values);
            return {
                dirty: dirty,
                isValid: dirty
                    ? _this.state.errors && Object.keys(_this.state.errors).length === 0
                    : isInitialValid !== false && isFunction(isInitialValid)
                        ? isInitialValid(_this.props)
                        : isInitialValid,
                initialValues: _this.initialValues,
            };
        };
        _this.getFormikBag = function () {
            return tslib_1.__assign({}, _this.state, _this.getFormikActions(), _this.getFormikComputedProps(), { registerField: _this.registerField, unregisterField: _this.unregisterField, handleBlur: _this.handleBlur, handleChange: _this.handleChange, handleReset: _this.handleReset, handleSubmit: _this.handleSubmit, validateOnChange: _this.props.validateOnChange, validateOnBlur: _this.props.validateOnBlur });
        };
        _this.getFormikContext = function () {
            return tslib_1.__assign({}, _this.getFormikBag(), { validationSchema: _this.props.validationSchema, validate: _this.props.validate, initialValues: _this.initialValues });
        };
        _this.state = {
            values: props.initialValues || {},
            errors: {},
            touched: {},
            isSubmitting: false,
            isValidating: false,
            submitCount: 0,
            status: props.initialStatus,
        };
        _this.didMount = false;
        _this.fields = {};
        _this.initialValues = props.initialValues || {};
        warning(!(props.component && props.render), 'You should not use <Formik component> and <Formik render> in the same <Formik> component; <Formik render> will be ignored');
        warning(!(props.component && props.children && !isEmptyChildren(props.children)), 'You should not use <Formik component> and <Formik children> in the same <Formik> component; <Formik children> will be ignored');
        warning(!(props.render && props.children && !isEmptyChildren(props.children)), 'You should not use <Formik render> and <Formik children> in the same <Formik> component; <Formik children> will be ignored');
        return _this;
    }
    Formik.prototype.componentDidMount = function () {
        this.didMount = true;
    };
    Formik.prototype.componentWillUnmount = function () {
        this.didMount = false;
        if (this.validator) {
            this.validator();
        }
    };
    Formik.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.enableReinitialize &&
            !isEqual(prevProps.initialValues, this.props.initialValues)) {
            this.initialValues = this.props.initialValues;
            this.resetForm(this.props.initialValues);
        }
    };
    Formik.prototype.runFieldLevelValidations = function (values) {
        var _this = this;
        var fieldKeysWithValidation = Object.keys(this.fields).filter(function (f) {
            return _this.fields &&
                _this.fields[f] &&
                _this.fields[f].props.validate &&
                isFunction(_this.fields[f].props.validate);
        });
        var fieldValidations = fieldKeysWithValidation.length > 0
            ? fieldKeysWithValidation.map(function (f) {
                return _this.runSingleFieldLevelValidation(f, getIn(values, f));
            })
            : [Promise.resolve('DO_NOT_DELETE_YOU_WILL_BE_FIRED')];
        return Promise.all(fieldValidations).then(function (fieldErrorsList) {
            return fieldErrorsList.reduce(function (prev, curr, index) {
                if (curr === 'DO_NOT_DELETE_YOU_WILL_BE_FIRED') {
                    return prev;
                }
                if (!!curr) {
                    prev = setIn(prev, fieldKeysWithValidation[index], curr);
                }
                return prev;
            }, {});
        });
    };
    Formik.prototype.runValidateHandler = function (values) {
        var _this = this;
        return new Promise(function (resolve) {
            var maybePromisedErrors = _this.props.validate(values);
            if (maybePromisedErrors === undefined) {
                resolve({});
            }
            else if (isPromise(maybePromisedErrors)) {
                maybePromisedErrors.then(function () {
                    resolve({});
                }, function (errors) {
                    resolve(errors);
                });
            }
            else {
                resolve(maybePromisedErrors);
            }
        });
    };
    Formik.prototype.render = function () {
        var _a = this.props, component = _a.component, render = _a.render, children = _a.children;
        var props = this.getFormikBag();
        var ctx = this.getFormikContext();
        return (React.createElement(FormikProvider, { value: ctx }, component
            ? React.createElement(component, props)
            : render
                ? render(props)
                : children
                    ? isFunction(children)
                        ? children(props)
                        : !isEmptyChildren(children)
                            ? React.Children.only(children)
                            : null
                    : null));
    };
    Formik.defaultProps = {
        validateOnChange: true,
        validateOnBlur: true,
        isInitialValid: false,
        enableReinitialize: false,
    };
    return Formik;
}(React.Component));
function warnAboutMissingIdentifier(_a) {
    var htmlContent = _a.htmlContent, documentationAnchorLink = _a.documentationAnchorLink, handlerName = _a.handlerName;
    console.warn("Warning: Formik called `" + handlerName + "`, but you forgot to pass an `id` or `name` attribute to your input:\n\n    " + htmlContent + "\n\n    Formik cannot determine which value to update. For more info see https://github.com/jaredpalmer/formik#" + documentationAnchorLink + "\n  ");
}
function yupToFormErrors(yupError) {
    var errors = {};
    if (yupError.inner.length === 0) {
        return setIn(errors, yupError.path, yupError.message);
    }
    for (var _i = 0, _a = yupError.inner; _i < _a.length; _i++) {
        var err = _a[_i];
        if (!errors[err.path]) {
            errors = setIn(errors, err.path, err.message);
        }
    }
    return errors;
}
function validateYupSchema(values, schema, sync, context) {
    if (sync === void 0) { sync = false; }
    if (context === void 0) { context = {}; }
    var validateData = {};
    for (var k in values) {
        if (values.hasOwnProperty(k)) {
            var key = String(k);
            validateData[key] = values[key] !== '' ? values[key] : undefined;
        }
    }
    return schema[sync ? 'validateSync' : 'validate'](validateData, {
        abortEarly: false,
        context: context,
    });
}
function arrayMerge(target, source, options) {
    var destination = target.slice();
    source.forEach(function (e, i) {
        if (typeof destination[i] === 'undefined') {
            var cloneRequested = options.clone !== false;
            var shouldClone = cloneRequested && options.isMergeableObject(e);
            destination[i] = shouldClone
                ? deepmerge(Array.isArray(e) ? [] : {}, e, options)
                : e;
        }
        else if (options.isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, options);
        }
        else if (target.indexOf(e) === -1) {
            destination.push(e);
        }
    });
    return destination;
}

var FieldInner = (function (_super) {
    tslib_1.__extends(FieldInner, _super);
    function FieldInner(props) {
        var _this = _super.call(this, props) || this;
        var render = props.render, children = props.children, component = props.component;
        warning(!(component && render), 'You should not use <Field component> and <Field render> in the same <Field> component; <Field component> will be ignored');
        warning(!(component && children && isFunction(children)), 'You should not use <Field component> and <Field children> as a function in the same <Field> component; <Field component> will be ignored.');
        warning(!(render && children && !isEmptyChildren(children)), 'You should not use <Field render> and <Field children> in the same <Field> component; <Field children> will be ignored');
        return _this;
    }
    FieldInner.prototype.componentDidMount = function () {
        this.props.formik.registerField(this.props.name, this);
    };
    FieldInner.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.name !== prevProps.name) {
            this.props.formik.unregisterField(prevProps.name);
            this.props.formik.registerField(this.props.name, this);
        }
        if (this.props.validate !== prevProps.validate) {
            this.props.formik.registerField(this.props.name, this);
        }
    };
    FieldInner.prototype.componentWillUnmount = function () {
        this.props.formik.unregisterField(this.props.name);
    };
    FieldInner.prototype.render = function () {
        var _a = this.props, validate = _a.validate, name = _a.name, render = _a.render, children = _a.children, _b = _a.component, component = _b === void 0 ? 'input' : _b, formik = _a.formik, props = tslib_1.__rest(_a, ["validate", "name", "render", "children", "component", "formik"]);
        var _validate = formik.validate, _validationSchema = formik.validationSchema, restOfFormik = tslib_1.__rest(formik, ["validate", "validationSchema"]);
        var field = {
            value: props.type === 'radio' || props.type === 'checkbox'
                ? props.value
                : getIn(formik.values, name),
            name: name,
            onChange: formik.handleChange,
            onBlur: formik.handleBlur,
        };
        var bag = { field: field, form: restOfFormik };
        if (render) {
            return render(bag);
        }
        if (isFunction(children)) {
            return children(bag);
        }
        if (typeof component === 'string') {
            var innerRef = props.innerRef, rest = tslib_1.__rest(props, ["innerRef"]);
            return React.createElement(component, tslib_1.__assign({ ref: innerRef }, field, rest, { children: children }));
        }
        return React.createElement(component, tslib_1.__assign({}, bag, props, { children: children }));
    };
    return FieldInner;
}(React.Component));
var Field = connect(FieldInner);

var Form = connect(function (_a) {
    var _b = _a.formik, handleReset = _b.handleReset, handleSubmit = _b.handleSubmit, props = tslib_1.__rest(_a, ["formik"]);
    return (React.createElement("form", tslib_1.__assign({ onReset: handleReset, onSubmit: handleSubmit }, props)));
});
Form.displayName = 'Form';

function withFormik(_a) {
    var _b = _a.mapPropsToValues, mapPropsToValues = _b === void 0 ? function (vanillaProps) {
        var val = {};
        for (var k in vanillaProps) {
            if (vanillaProps.hasOwnProperty(k) &&
                typeof vanillaProps[k] !== 'function') {
                val[k] = vanillaProps[k];
            }
        }
        return val;
    } : _b, config = tslib_1.__rest(_a, ["mapPropsToValues"]);
    return function createFormik(Component) {
        var componentDisplayName = Component.displayName ||
            Component.name ||
            (Component.constructor && Component.constructor.name) ||
            'Component';
        var C = (function (_super) {
            tslib_1.__extends(C, _super);
            function C() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.validate = function (values) {
                    return config.validate(values, _this.props);
                };
                _this.validationSchema = function () {
                    return isFunction(config.validationSchema)
                        ? config.validationSchema(_this.props)
                        : config.validationSchema;
                };
                _this.handleSubmit = function (values, actions) {
                    return config.handleSubmit(values, tslib_1.__assign({}, actions, { props: _this.props }));
                };
                _this.renderFormComponent = function (formikProps) {
                    return React.createElement(Component, tslib_1.__assign({}, _this.props, formikProps));
                };
                return _this;
            }
            C.prototype.render = function () {
                var _a = this.props, children = _a.children, props = tslib_1.__rest(_a, ["children"]);
                return (React.createElement(Formik, tslib_1.__assign({}, props, config, { validate: config.validate && this.validate, validationSchema: config.validationSchema && this.validationSchema, initialValues: mapPropsToValues(this.props), initialStatus: config.mapPropsToStatus && config.mapPropsToStatus(this.props), onSubmit: this.handleSubmit, render: this.renderFormComponent })));
            };
            C.displayName = "WithFormik(" + componentDisplayName + ")";
            return C;
        }(React.Component));
        return hoistNonReactStatics(C, Component);
    };
}

var move = function (array, from, to) {
    var copy = (array || []).slice();
    var value = copy[from];
    copy.splice(from, 1);
    copy.splice(to, 0, value);
    return copy;
};
var swap = function (array, indexA, indexB) {
    var copy = (array || []).slice();
    var a = copy[indexA];
    copy[indexA] = copy[indexB];
    copy[indexB] = a;
    return copy;
};
var insert = function (array, index, value) {
    var copy = (array || []).slice();
    copy.splice(index, 0, value);
    return copy;
};
var replace = function (array, index, value) {
    var copy = (array || []).slice();
    copy[index] = value;
    return copy;
};
var FieldArrayInner = (function (_super) {
    tslib_1.__extends(FieldArrayInner, _super);
    function FieldArrayInner(props) {
        var _this = _super.call(this, props) || this;
        _this.updateArrayField = function (fn, alterTouched, alterErrors) {
            var _a = _this.props, name = _a.name, validateOnChange = _a.validateOnChange, _b = _a.formik, setFormikState = _b.setFormikState, validateForm = _b.validateForm;
            setFormikState(function (prevState) {
                var updateErrors = typeof alterErrors === 'function' ? alterErrors : fn;
                var updateTouched = typeof alterTouched === 'function' ? alterTouched : fn;
                return tslib_1.__assign({}, prevState, { values: setIn(prevState.values, name, fn(getIn(prevState.values, name))), errors: alterErrors
                        ? setIn(prevState.errors, name, updateErrors(getIn(prevState.errors, name)))
                        : prevState.errors, touched: alterTouched
                        ? setIn(prevState.touched, name, updateTouched(getIn(prevState.touched, name)))
                        : prevState.touched });
            }, function () {
                if (validateOnChange) {
                    validateForm();
                }
            });
        };
        _this.push = function (value) {
            return _this.updateArrayField(function (array) { return (array || []).concat([cloneDeep(value)]); }, false, false);
        };
        _this.handlePush = function (value) { return function () { return _this.push(value); }; };
        _this.swap = function (indexA, indexB) {
            return _this.updateArrayField(function (array) { return swap(array, indexA, indexB); }, true, true);
        };
        _this.handleSwap = function (indexA, indexB) { return function () {
            return _this.swap(indexA, indexB);
        }; };
        _this.move = function (from, to) {
            return _this.updateArrayField(function (array) { return move(array, from, to); }, true, true);
        };
        _this.handleMove = function (from, to) { return function () { return _this.move(from, to); }; };
        _this.insert = function (index, value) {
            return _this.updateArrayField(function (array) { return insert(array, index, value); }, function (array) { return insert(array, index, null); }, function (array) { return insert(array, index, null); });
        };
        _this.handleInsert = function (index, value) { return function () { return _this.insert(index, value); }; };
        _this.replace = function (index, value) {
            return _this.updateArrayField(function (array) { return replace(array, index, value); }, false, false);
        };
        _this.handleReplace = function (index, value) { return function () {
            return _this.replace(index, value);
        }; };
        _this.unshift = function (value) {
            var length = -1;
            _this.updateArrayField(function (array) {
                var arr = array ? [value].concat(array) : [value];
                if (length < 0) {
                    length = arr.length;
                }
                return arr;
            }, function (array) {
                var arr = array ? [null].concat(array) : [null];
                if (length < 0)
                    length = arr.length;
                return arr;
            }, function (array) {
                var arr = array ? [null].concat(array) : [null];
                if (length < 0)
                    length = arr.length;
                return arr;
            });
            return length;
        };
        _this.handleUnshift = function (value) { return function () { return _this.unshift(value); }; };
        _this.handleRemove = function (index) { return function () { return _this.remove(index); }; };
        _this.handlePop = function () { return function () { return _this.pop(); }; };
        _this.remove = _this.remove.bind(_this);
        _this.pop = _this.pop.bind(_this);
        return _this;
    }
    FieldArrayInner.prototype.remove = function (index) {
        var result;
        this.updateArrayField(function (array) {
            var copy = array ? array.slice() : [];
            if (!result) {
                result = copy[index];
            }
            if (isFunction(copy.splice)) {
                copy.splice(index, 1);
            }
            return copy;
        }, true, true);
        return result;
    };
    FieldArrayInner.prototype.pop = function () {
        var result;
        this.updateArrayField(function (array) {
            var tmp = array;
            if (!result) {
                result = tmp && tmp.pop && tmp.pop();
            }
            return tmp;
        }, true, true);
        return result;
    };
    FieldArrayInner.prototype.render = function () {
        var arrayHelpers = {
            push: this.push,
            pop: this.pop,
            swap: this.swap,
            move: this.move,
            insert: this.insert,
            replace: this.replace,
            unshift: this.unshift,
            remove: this.remove,
            handlePush: this.handlePush,
            handlePop: this.handlePop,
            handleSwap: this.handleSwap,
            handleMove: this.handleMove,
            handleInsert: this.handleInsert,
            handleReplace: this.handleReplace,
            handleUnshift: this.handleUnshift,
            handleRemove: this.handleRemove,
        };
        var _a = this.props, component = _a.component, render = _a.render, children = _a.children, name = _a.name, _b = _a.formik, _validate = _b.validate, _validationSchema = _b.validationSchema, restOfFormik = tslib_1.__rest(_b, ["validate", "validationSchema"]);
        var props = tslib_1.__assign({}, arrayHelpers, { form: restOfFormik, name: name });
        return component
            ? React.createElement(component, props)
            : render
                ? render(props)
                : children
                    ? typeof children === 'function'
                        ? children(props)
                        : !isEmptyChildren(children) ? React.Children.only(children) : null
                    : null;
    };
    FieldArrayInner.defaultProps = {
        validateOnChange: true,
    };
    return FieldArrayInner;
}(React.Component));
var FieldArray = connect(FieldArrayInner);

var FastFieldInner = (function (_super) {
    tslib_1.__extends(FastFieldInner, _super);
    function FastFieldInner(props) {
        var _this = _super.call(this, props) || this;
        var render = props.render, children = props.children, component = props.component;
        warning(!(component && render), 'You should not use <FastField component> and <FastField render> in the same <FastField> component; <FastField component> will be ignored');
        warning(!(component && children && isFunction(children)), 'You should not use <FastField component> and <FastField children> as a function in the same <FastField> component; <FastField component> will be ignored.');
        warning(!(render && children && !isEmptyChildren(children)), 'You should not use <FastField render> and <FastField children> in the same <FastField> component; <FastField children> will be ignored');
        return _this;
    }
    FastFieldInner.prototype.shouldComponentUpdate = function (props) {
        if (this.props.shouldUpdate) {
            return this.props.shouldUpdate(props, this.props);
        }
        else if (getIn(this.props.formik.values, this.props.name) !==
            getIn(props.formik.values, this.props.name) ||
            getIn(this.props.formik.errors, this.props.name) !==
                getIn(props.formik.errors, this.props.name) ||
            getIn(this.props.formik.touched, this.props.name) !==
                getIn(props.formik.touched, this.props.name) ||
            Object.keys(this.props).length !== Object.keys(props).length ||
            this.props.formik.isSubmitting !== props.formik.isSubmitting) {
            return true;
        }
        else {
            return false;
        }
    };
    FastFieldInner.prototype.componentDidMount = function () {
        this.props.formik.registerField(this.props.name, this);
    };
    FastFieldInner.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.name !== prevProps.name) {
            this.props.formik.unregisterField(prevProps.name);
            this.props.formik.registerField(this.props.name, this);
        }
        if (this.props.validate !== prevProps.validate) {
            this.props.formik.registerField(this.props.name, this);
        }
    };
    FastFieldInner.prototype.componentWillUnmount = function () {
        this.props.formik.unregisterField(this.props.name);
    };
    FastFieldInner.prototype.render = function () {
        var _a = this.props, validate = _a.validate, name = _a.name, render = _a.render, children = _a.children, _b = _a.component, component = _b === void 0 ? 'input' : _b, formik = _a.formik, shouldUpdate = _a.shouldUpdate, props = tslib_1.__rest(_a, ["validate", "name", "render", "children", "component", "formik", "shouldUpdate"]);
        var _validate = formik.validate, _validationSchema = formik.validationSchema, restOfFormik = tslib_1.__rest(formik, ["validate", "validationSchema"]);
        var field = {
            value: props.type === 'radio' || props.type === 'checkbox'
                ? props.value
                : getIn(formik.values, name),
            name: name,
            onChange: formik.handleChange,
            onBlur: formik.handleBlur,
        };
        var bag = { field: field, form: restOfFormik };
        if (render) {
            return render(bag);
        }
        if (isFunction(children)) {
            return children(bag);
        }
        if (typeof component === 'string') {
            var innerRef = props.innerRef, rest = tslib_1.__rest(props, ["innerRef"]);
            return React.createElement(component, tslib_1.__assign({ ref: innerRef }, field, rest, { children: children }));
        }
        return React.createElement(component, tslib_1.__assign({}, bag, props, { children: children }));
    };
    return FastFieldInner;
}(React.Component));
var FastField = connect(FastFieldInner);

var ErrorMessageImpl = (function (_super) {
    tslib_1.__extends(ErrorMessageImpl, _super);
    function ErrorMessageImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ErrorMessageImpl.prototype.shouldComponentUpdate = function (props) {
        if (getIn(this.props.formik.errors, this.props.name) !==
            getIn(props.formik.errors, this.props.name) ||
            getIn(this.props.formik.touched, this.props.name) !==
                getIn(props.formik.touched, this.props.name) ||
            Object.keys(this.props).length !== Object.keys(props).length) {
            return true;
        }
        else {
            return false;
        }
    };
    ErrorMessageImpl.prototype.render = function () {
        var _a = this.props, component = _a.component, formik = _a.formik, render = _a.render, children = _a.children, name = _a.name, rest = tslib_1.__rest(_a, ["component", "formik", "render", "children", "name"]);
        var touch = getIn(formik.touched, name);
        var error = getIn(formik.errors, name);
        return !!touch && !!error
            ? render
                ? isFunction(render) ? render(error) : null
                : children
                    ? isFunction(children) ? children(error) : null
                    : component
                        ? React.createElement(component, rest, error)
                        : error
            : null;
    };
    return ErrorMessageImpl;
}(React.Component));
var ErrorMessage = connect(ErrorMessageImpl);

exports.ErrorMessage = ErrorMessage;
exports.FastField = FastField;
exports.Field = Field;
exports.FieldArray = FieldArray;
exports.Form = Form;
exports.Formik = Formik;
exports.FormikConsumer = FormikConsumer;
exports.FormikProvider = FormikProvider;
exports.connect = connect;
exports.getActiveElement = getActiveElement;
exports.getIn = getIn;
exports.insert = insert;
exports.isEmptyChildren = isEmptyChildren;
exports.isFunction = isFunction;
exports.isInputEvent = isInputEvent;
exports.isInteger = isInteger;
exports.isNaN = isNaN;
exports.isObject = isObject;
exports.isPromise = isPromise;
exports.isString = isString;
exports.makeCancelable = makeCancelable;
exports.move = move;
exports.replace = replace;
exports.setIn = setIn;
exports.setNestedObjectValues = setNestedObjectValues;
exports.swap = swap;
exports.validateYupSchema = validateYupSchema;
exports.withFormik = withFormik;
exports.yupToFormErrors = yupToFormErrors;
//# sourceMappingURL=formik.cjs.development.js.map
