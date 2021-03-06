import * as assert from 'assert'
import { cata, ana, para, hylo } from '../src'
import { Expr, ExprF, functorExpr, mul, add, const_, Const, Mul, Add } from './Expr'
import { Nat, NatF, functorNat, zero, succ, Zero, Succ } from './Nat'
import { TreeF, functorTree, Empty, Leaf, Node } from './Tree'

function show(expr: Expr): string {
  function alg(expr: ExprF<string>): string {
    switch (expr._tag) {
      case 'Const':
        return String(expr.value)
      case 'Add':
        return `(${expr.x}+${expr.y})`
      case 'Mul':
        return `(${expr.x}*${expr.y})`
    }
  }

  return cata(functorExpr)(alg)(expr)
}

function natsum(nat: Nat): number {
  function alg(nat: NatF<number>): number {
    switch (nat._tag) {
      case 'Zero':
        return 0
      case 'Succ':
        return 1 + nat.value
    }
  }
  return cata(functorNat)(alg)(nat)
}

describe('cata', () => {
  it('expr', () => {
    function evaluate(expr: Expr): number {
      function alg(expr: ExprF<number>): number {
        switch (expr._tag) {
          case 'Const':
            return expr.value
          case 'Add':
            return expr.x + expr.y
          case 'Mul':
            return expr.x * expr.y
        }
      }
      return cata(functorExpr)(alg)(expr)
    }

    const expr = mul(add(const_(2), const_(3)), const_(4))
    assert.strictEqual(evaluate(expr), 20)
    assert.strictEqual(show(expr), '((2+3)*4)')
  })

  it('nat', () => {
    const _4 = succ(succ(succ(succ(zero))))
    assert.strictEqual(natsum(_4), 4)
  })
})

describe('ana', () => {
  it('expr', () => {
    // convert ints into a representation in our language just using 2’s and 1’s
    function toExpr(n: number): Expr {
      function coalg(n: number): ExprF<number> {
        if (n === 0) {
          return new Const(0)
        } else if (n === 1) {
          return new Const(1)
        } else if (n === 2) {
          return new Const(2)
        } else if (n % 2 === 0) {
          return new Mul(2, n / 2)
        }
        return new Add(1, n - 1)
      }
      return ana(functorExpr)(coalg)(n)
    }
    assert.strictEqual(show(toExpr(31)), '(1+(2*(1+(2*(1+(2*(1+2)))))))')
  })

  it('nat', () => {
    function toNat(n: number): Nat {
      function coalg(n: number): NatF<number> {
        if (n === 0) {
          return Zero.value
        }
        return new Succ(n - 1)
      }
      return ana(functorNat)(coalg)(n)
    }

    assert.deepEqual(natsum(toNat(4)), 4)
  })
})

describe('hylo', () => {
  it('mergeSort', () => {
    function merge<A>(xs: Array<A>, ys: Array<A>): Array<A> {
      if (xs.length === 0) {
        return ys
      } else if (ys.length === 0) {
        return xs
      } else {
        const x = xs[0]
        const y = ys[0]
        if (x <= y) {
          return [x].concat(merge(xs.slice(1), ys))
        } else {
          return [y].concat(merge(xs, ys.slice(1)))
        }
      }
    }
    function alg<A>(tree: TreeF<A, Array<A>>): Array<A> {
      switch (tree._tag) {
        case 'Empty':
          return []
        case 'Leaf':
          return [tree.value]
        case 'Node':
          return merge(tree.left, tree.right)
      }
    }
    function coalg<A>(xs: Array<A>): TreeF<A, Array<A>> {
      if (xs.length === 0) {
        return Empty.value
      } else if (xs.length === 1) {
        return new Leaf(xs[0])
      } else {
        const i = Math.floor(xs.length / 2)
        return new Node(xs.slice(0, i), xs.slice(i))
      }
    }
    const xs = [1, 4, 3, 2]
    const as = hylo(functorTree)(
      (tree: TreeF<number, Array<number>>) => alg(tree),
      (xs: Array<number>) => coalg(xs),
    )(xs)
    assert.deepEqual(as, [1, 2, 3, 4])
  })
})

describe('para', () => {
  it('factorial', () => {
    function natfac(nat: Nat): number {
      function alg(natf: NatF<[Nat, number]>): number {
        switch (natf._tag) {
          case 'Zero':
            return 1
          case 'Succ':
            return natsum(succ(natf.value[0])) * natf.value[1]
        }
      }
      return para(functorNat)(alg)(nat)
    }

    const _4 = succ(succ(succ(succ(zero))))
    assert.deepEqual(natfac(_4), 24)
  })
})
