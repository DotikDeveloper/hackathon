import {VMRunner,VMRunnerContext} from 'vmrunner';

const defaultScope = new VMRunnerContext()
.withScopeObj(global)
.withWrapScope(false);

VMRunner.defaultCtx = defaultScope;

function validate(expression){
    const validateScope = new VMRunnerContext()
    .withScopeObj({})
    .withWrapScope(false);

    const vmRunner = new VMRunner(validateScope)
    .withThrow(false)
    .withConvertResult(false);

    return vmRunner.validate(expression);
}





export {
    validate,defaultScope
}