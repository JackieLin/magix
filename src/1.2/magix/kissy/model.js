/**
 * @fileOverview Model
 * @version 1.1
 * @author 行列
 */
KISSY.add('magix/model', function(S, Magix) {
    var Extend = function(props, ctor) {
        var BaseModel = function() {
            BaseModel.superclass.constructor.apply(this, arguments);
            if (ctor) {
                Magix.safeExec(ctor, [], this);
            }
        };
        return S.extend(BaseModel, this, props);
    };
    eval(Magix.include('../tmpl/model', 1));
    return Model;
}, {
    requires: ['magix/magix']
});