// export type Optic<T> = {
//     value: T
//     update: (updater: (current: T) => T) => void
// }

// // at :: (Optic<T[], T[]>, Int) -> Optic<T[], T>
// // each :: Optic<T[], T[]> -> Optic<T[], T[]>

// // ... | at(3) |> prop("foo") :: Optic<{ foo: string }[], string>
// // ... | each() |> prop("foo") :: Optic<{ foo: string }[], string[]>

// type Lens<T, K> = {
//     get: (obj: T) => K
//     set: (obj: T, value: K) => T
// }

// const at = <T>(index: number): Lens<T[], T> => {
//     return {
//         get: (obj: T[]) => obj[index],
//         set: (obj: T[], value: T) => {
//             const newArray = [...obj]
//             newArray[index] = value
//             return newArray
//         },
//     }
// }

// const prop = <T, K extends keyof T>(key: K): Lens<T, T[K]> => {
//     return {
//         get: (obj: T) => obj[key],
//         set: (obj: T, value: T[K]) => ({
//             ...obj,
//             [key]: value,
//         }),
//     }
// }

// const compose = <A, B, C>(lens1: Lens<A, B>, lens2: Lens<B, C>): Lens<A, C> => {
//     return {
//         get: (obj: A) => lens2.get(lens1.get(obj)),
//         set: (obj: A, value: C) => lens1.set(obj, lens2.set(lens1.get(obj), value)),
//     }
// }

// const pipe = (...lenses: Lens<any, any>[]): Lens<any, any> => {
//     return lenses.reduce((acc, lens) => compose(acc, lens))
// }

// const each = <T, U>(lens: Lens<T, U>): Lens<T[], U[]> => {
//     return {
//         get: (obj: T[]) => obj.map(item => lens.get(item)),
//         set: (obj: T[], value: U[]) => {
//             return obj.map((item, index) => lens.set(item, value[index]))
//         },
//     }
// }

// const arrayMap =
//     <T, U>(fn: (item: T) => U) =>
//     (arr: T[]): U[] => {
//         return arr.map(fn)
//     }

// const lensGet = <T, K>(value: T, lens: Lens<T, K>): K => {
//     return lens.get(value)
// }

// const lensSet = <T, K>(value: T, lens: Lens<T, K>, newValue: K): T => {
//     return lens.set(value, newValue)
// }

// const lensUpdate = <T, K>(value: T, lens: Lens<T, K>, updater: (current: K) => K): T => {
//     const currentValue = lens.get(value)
//     const newValue = updater(currentValue)
//     return lens.set(value, newValue)
// }

// // Example usage:

// const arr = [{ foo: 10 }, { foo: 20 }, { foo: 30 }]

// // get
// lensGet(arr, compose(at(1), prop("foo"))) // 20
// lensGet(arr, each(prop("foo"))) // [10, 20, 30]

// // set
// lensSet(arr, compose(at(1), prop("foo")), 50) // [{ foo: 10 }, { foo: 50 }, { foo: 30 }]
// lensSet(arr, each(prop("foo")), [100, 200, 300]) // [{ foo: 100 }, { foo: 200 }, { foo: 300 }]

// // update
// lensUpdate(arr, compose(at(1), prop("foo")), v => v + 5) // [{ foo: 10 }, { foo: 25 }, { foo: 30 }]
// lensUpdate(
//     arr,
//     each(prop("foo")),
//     arrayMap(v => v * 2)
// ) // [{ foo: 20 }, { foo: 40 }, { foo: 60 }]

// // export const prop = <T, K extends keyof T>(signal: Optic<T>, key: K): Optic<T[K]> => {
// //     return {
// //         get value() {
// //             return signal.value[key]
// //         },
// //         update(updater: (current: T[K]) => T[K]) {
// //             signal.update(current => ({
// //                 ...current,
// //                 [key]: updater(current[key]),
// //             }))
// //         },
// //     }
// // }

// // export const useOptic = <T>(initialValue: T): Optic<T> => {
// //     const [value, setValue] = useState<T>(initialValue)

// //     const update = (updater: (current: T) => T) => {
// //         setValue(current => updater(current))
// //     }

// //     return {
// //         value,
// //         update,
// //     }
// // }

// // class OpticObject<T> {
// //     #getter: () => T
// //     #updater: (updater: (current: T) => T) => void

// //     constructor(getter: () => T, updater: (updater: (current: T) => T) => void) {
// //         this.#getter = getter
// //         this.#updater = updater
// //     }

// //     get value() {
// //         return this.#getter()
// //     }

// //     update(updater: (current: T) => T) {
// //         this.#updater(updater)
// //     }

// //     prop<K extends keyof T>(key: K): OpticObject<T[K]> {
// //         return new OpticObject<T[K]>(
// //             () => this.#getter()[key],
// //             updater => {
// //                 this.#updater(current => ({
// //                     ...current,
// //                     [key]: updater(current[key]),
// //                 }))
// //             }
// //         )
// //     }

// //     at(index: number): OpticObject<T extends Array<infer U> ? U : never> {
// //         return new OpticObject<T extends Array<infer U> ? U : never>(
// //             () => (this.#getter() as any)[index],
// //             updater => {
// //                 this.#updater(current => {
// //                     const newArray = [...(current as any)]
// //                     newArray[index] = updater(newArray[index])
// //                     return newArray as T
// //                 })
// //             }
// //         )
// //     }

// //     each(): OpticObject<T extends Array<infer U> ? U : never> {
// //         return new OpticObject<T extends Array<infer U> ? U : never>(
// //             () => {
// //                 throw new Error("$each cannot be used to get a value directly")
// //             },
// //             updater => {
// //                 this.#updater(current => {
// //                     return (current as any).map((item: any) => updater(item)) as T
// //                 })
// //             }
// //         )
// //     }
// // }

// // type OpticArray<T> = Optic<T[]> & {
// //     at: (index: number) => GenericOptic<T>
// //     each: () => GenericOptic<T>
// // }

// // type OpticProps<T extends object> = Optic<T> & {
// //     [K in keyof T]: GenericOptic<T[K]>
// // }

// // type GenericOptic<T> = T extends Array<infer U> ? OpticArray<U> : T extends object ? OpticProps<T> : Optic<T>

// // function createOptic<T>(getter: () => T, updater: (updater: (current: T) => T) => void): GenericOptic<T> {
// //     return new Proxy(new OpticObject<T>(getter, updater), {
// //         get(target, prop, receiver) {
// //             if (prop === "at" && Array.isArray(target.value)) {
// //                 return target.at.bind(target)
// //             }
// //             if (typeof prop === "string") {
// //                 return target.prop(prop as keyof T)
// //             }
// //             return target.prop(prop as keyof T)
// //         },
// //     }) as unknown as GenericOptic<T>
// // }

// // let x = [{ foo: 10 }, { foo: 20 }, { foo: 30 }]
// // const optic = createOptic(
// //     () => x,
// //     updater => (x = updater(x))
// // )

// // optic.at(1).foo.update(v => v + 5)
// // optic.each().foo.update(v => v * 2)
