/**
 * @fileOverview Model
 * @version 1.1
 * @author 行列
 */
define('magix/model', ['magix/magix'], function(Magix) {

    var Extend = function(props, ctor) {
        var me = this;
        var BaseModel = function() {
            BaseModel.superclass.constructor.apply(this, arguments);
            if (ctor) {
                Magix.safeExec(ctor, arguments, this);
            }
        };

        return Magix.extend(BaseModel, me, props);

    };
    eval(Magix.include('../tmpl/model', 1));
    return Model;
});