import { describe, expect, test } from "bun:test"
import { GenericFunction } from "./multi-dispatch"
import { ANY, AbstractType, BaseType, ConcreteType, ParametricType, TypeVar, isSubtype } from "./type-system"

import * as mutliDispatch from "./multi-dispatch"

describe("Type System and Multiple Dispatch", () => {
    describe("Type Hierarchy", () => {
        test("checks subtyping reflexivity", () => {
            const IntT = new ConcreteType("Int", ANY)
            expect(isSubtype(IntT, IntT)).toBe(true)
        })

        test("checks Any as top type", () => {
            const IntT = new ConcreteType("Int", ANY)
            expect(isSubtype(IntT, ANY)).toBe(true)
            expect(isSubtype(ANY, ANY)).toBe(true)
        })

        test("checks hierarchy traversal", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)
            const FloatT = new ConcreteType("Float", NumberT)

            expect(isSubtype(IntT, NumberT)).toBe(true)
            expect(isSubtype(FloatT, NumberT)).toBe(true)
        })

        test("checks non-subtype relationships", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)
            const FloatT = new ConcreteType("Float", NumberT)
            const StringT = new ConcreteType("String", ANY)

            expect(isSubtype(IntT, FloatT)).toBe(false)
            expect(isSubtype(StringT, NumberT)).toBe(false)
        })

        test("Any is not subtype of concrete types", () => {
            const IntT = new ConcreteType("Int", ANY)
            expect(isSubtype(ANY, IntT)).toBe(false)
        })
    })

    describe("Parametric Types", () => {
        test("parametric types are invariant", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)

            const ArrayOfIntT = new ParametricType("Array", [IntT], ANY)
            const ArrayOfNumberT = new ParametricType("Array", [NumberT], ANY)

            // Invariant: Array[Int] is NOT a subtype of Array[Number]
            expect(isSubtype(ArrayOfIntT, ArrayOfNumberT)).toBe(false)
        })

        test("same parametric types are equal", () => {
            const IntT = new ConcreteType("Int", ANY)
            const ArrayOfInt1 = new ParametricType("Array", [IntT], ANY)
            const ArrayOfInt2 = new ParametricType("Array", [IntT], ANY)

            // Both have same base and same type args (by id)
            expect(isSubtype(ArrayOfInt1, ArrayOfInt2)).toBe(true)
        })

        test("parametric hierarchy traversal", () => {
            const IntT = new ConcreteType("Int", ANY)

            const AbstractCollectionT = new AbstractType("Collection", ANY)
            const ListOfIntT = new ParametricType("List", [IntT], AbstractCollectionT)

            // Array<Int> can be subtype of parent if parent is in hierarchy
            expect(isSubtype(ListOfIntT, AbstractCollectionT)).toBe(true)
        })
    })

    describe("Type Variables", () => {
        test("type variable with Any constraint", () => {
            const T = new TypeVar("T", ANY)
            const IntT = new ConcreteType("Int", ANY)

            expect(isSubtype(IntT, T)).toBe(true)
        })

        test("type variable with constraint", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)
            const StringT = new ConcreteType("String", ANY)
            const TNumber = new TypeVar("T", NumberT)

            expect(isSubtype(IntT, TNumber)).toBe(true)
            expect(isSubtype(StringT, TNumber)).toBe(false)
        })

        test("type variable string representation", () => {
            const NumberT = new AbstractType("Number", ANY)
            const TNumber = new TypeVar("T", NumberT)

            expect(TNumber.toString()).toMatch(/T<:Number/)
        })
    })

    describe("Multiple Dispatch", () => {
        test("dispatches to exact method match", () => {
            const IntT = new ConcreteType("Int", ANY)
            const add = new GenericFunction("add", [
                {
                    typeVars: [],
                    signature: [IntT, IntT],
                    fn: (a: any, b: any) => a.val + b.val,
                },
            ])

            const result = add.call({ val: 1, __type__: IntT }, { val: 2, __type__: IntT })
            expect(result).toBe(3)
        })

        test("dispatches to most specific method", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)

            let calledGeneric = false
            let calledInt = false
            const add = new GenericFunction("add", [
                {
                    typeVars: [],
                    signature: [NumberT, NumberT],
                    fn: (a: any, b: any) => {
                        calledGeneric = true
                        return a.val + b.val
                    },
                },
                {
                    typeVars: [],
                    signature: [IntT, IntT],
                    fn: (a: any, b: any) => {
                        calledInt = true
                        return a.val + b.val
                    },
                },
            ])

            add.call({ val: 1, __type__: IntT }, { val: 2, __type__: IntT })

            expect(calledInt).toBe(true)
            expect(calledGeneric).toBe(false)
        })

        test("dispatches to generic method with type variable", () => {
            const T = new TypeVar("T", ANY)
            const StringT = new ConcreteType("String", ANY)

            const concat = new GenericFunction("concat", [
                {
                    typeVars: [T],
                    signature: [T, T],
                    fn: (a: any, b: any) => `${a.val}${b.val}`,
                },
            ])

            const result = concat.call({ val: "hello", __type__: StringT }, { val: "world", __type__: StringT })
            expect(result).toBe("helloworld")
        })

        test("throws error on no matching method", () => {
            const IntT = new ConcreteType("Int", ANY)
            const StringT = new ConcreteType("String", ANY)

            const add = new GenericFunction("add", [
                {
                    typeVars: [],
                    signature: [IntT, IntT],
                    fn: (a: any, b: any) => a.val + b.val,
                },
            ])

            expect(() => add.call({ val: 1, __type__: IntT }, { val: "x", __type__: StringT })).toThrow()
        })

        test("throws error on ambiguous method call", () => {
            const IntT = new ConcreteType("Int", ANY)

            const mix = new GenericFunction("mix", [
                {
                    typeVars: [],
                    signature: [IntT, ANY],
                    fn: (_a: any, _b: any) => "Int/Any",
                },
                {
                    typeVars: [],
                    signature: [ANY, IntT],
                    fn: (_a: any, _b: any) => "Any/Int",
                },
            ])

            expect(() => mix.call({ val: 1, __type__: IntT }, { val: 1, __type__: IntT })).toThrow()
        })

        test("caches method resolution", () => {
            const IntT = new ConcreteType("Int", ANY)

            let callCount = 0

            // @ts-ignore
            mutliDispatch.debug.cacheHitCallback = (name: string, argTypes: BaseType[]) => {
                // console.log(`Cache hit for "${name}(${argTypes.map(t => t.toString()).join(", ")})"`)
                callCount++
            }

            const add = new GenericFunction("add", [
                {
                    typeVars: [],
                    signature: [IntT, IntT],
                    fn: (a: any, b: any) => {
                        return a.val + b.val
                    },
                },
            ])

            // First call
            add.call({ val: 1, __type__: IntT }, { val: 2, __type__: IntT })

            // Second call with same types should use cache (only increment once)
            add.call({ val: 3, __type__: IntT }, { val: 4, __type__: IntT })

            expect(callCount).toBe(1) // Cache hit should have occurred once
        })

        test("handles multiple methods and chooses most specific", () => {
            const NumberT = new AbstractType("Number", ANY)
            const IntT = new ConcreteType("Int", NumberT)
            const FloatT = new ConcreteType("Float", NumberT)
            const T = new TypeVar("T", ANY)

            let methodCalled = ""

            // Register in reverse specificity order to test sorting
            const add = new GenericFunction("add", [
                {
                    typeVars: [],
                    signature: [IntT, IntT],
                    fn: (a: any, b: any) => {
                        methodCalled = "int"
                        return a.val + b.val
                    },
                },
                {
                    typeVars: [],
                    signature: [NumberT, NumberT],
                    fn: (a: any, b: any) => {
                        methodCalled = "number"
                        return a.val + b.val
                    },
                },
                {
                    typeVars: [T],
                    signature: [T, T],
                    fn: (a: any, b: any) => {
                        methodCalled = "generic"
                        return `${a.val},${b.val}`
                    },
                },
            ])

            // Call with (Int, Int) - should dispatch to Int method (most specific)
            add.call({ val: 1, __type__: IntT }, { val: 2, __type__: IntT })
            expect(methodCalled).toBe("int")

            // Call with (Float, Int) - both subtypes of Number, should dispatch to Number method
            add.call({ val: 1.5, __type__: FloatT }, { val: 2, __type__: IntT })
            expect(methodCalled).toBe("number")
        })
    })

    describe("Type Variable Unification", () => {
        test("unifies type variable consistently", () => {
            const T = new TypeVar("T", ANY)
            const IntT = new ConcreteType("Int", ANY)
            const StringT = new ConcreteType("String", ANY)

            let resultType = ""
            const generic = new GenericFunction("identity", [
                {
                    typeVars: [T],
                    signature: [T],
                    fn: (a: any) => {
                        resultType = a.__type__.name
                        return a.val
                    },
                },
            ])

            // Call with Int - T should be Int
            generic.call({ val: 42, __type__: IntT })
            expect(resultType).toBe("Int")

            // Call with String - T should be String
            generic.call({ val: "hello", __type__: StringT })
            expect(resultType).toBe("String")
        })

        test("rejects inconsistent type variable bindings", () => {
            const T = new TypeVar("T", ANY)
            const IntT = new ConcreteType("Int", ANY)
            const StringT = new ConcreteType("String", ANY)

            const pairCheck = new GenericFunction("pairCheck", [
                {
                    typeVars: [T],
                    signature: [T, T],
                    fn: (_a: any, _b: any) => "match",
                },
            ])

            // (Int, String) should not match (T, T) because T can't be both Int and String
            expect(() => pairCheck.call({ val: 42, __type__: IntT }, { val: "hello", __type__: StringT })).toThrow()
        })
    })
})
