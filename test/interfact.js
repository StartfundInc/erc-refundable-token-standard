const Callee = artifacts.require('./examples/Callee')

contract('Interact', accounts => {
    const [creator, seller, buyer01, buyer02, ...others] = accounts
    let tokenCallee
    let tokenCaller
    before(async () => {
        tokenCallee = await Callee.new()
            tokenCaller = await Callee.new()
    })
    it('calle test', async () => {
        const res1 = await tokenCallee.setX(10)
        const res2 = await tokenCallee.getX()
        //console.log('----check---', {res1, res2})
    })

    it('caller test', async () => {
        const res1 = await tokenCaller.setXFromAddress(tokenCallee.address, 100)
        const res2 = await tokenCallee.getX()
        //console.log('----check---', {res1, res2})
    })
})
