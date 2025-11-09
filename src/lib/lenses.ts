// export type Optic<T> = {
//     value: T
//     update: (updater: (current: T) => T) => void
// }

export type Lens<T, K> = {
    get: (obj: T) => K
    set: (obj: T, value: K) => T
}

export const Lens = {
    // Common lenses
    Identity: <T>(): Lens<T, T> => ({
        get: (obj: T) => obj,
        set: (_obj: T, value: T) => value,
    }),

    // Lens constructors
    at: <T>(index: number): Lens<T[], T> => {
        return {
            get: (obj: T[]) => obj[index],
            set: (obj: T[], value: T) => {
                const newArray = [...obj]
                newArray[index] = value
                return newArray
            },
        }
    },
    prop: <T, K extends keyof T>(key: K): Lens<T, T[K]> => {
        return {
            get: (obj: T) => obj[key],
            set: (obj: T, value: T[K]) => ({
                ...obj,
                [key]: value,
            }),
        }
    },

    // Lens combinators
    compose: <A, B, C>(lens1: Lens<A, B>, lens2: Lens<B, C>): Lens<A, C> => {
        return {
            get: (obj: A) => lens2.get(lens1.get(obj)),
            set: (obj: A, value: C) => lens1.set(obj, lens2.set(lens1.get(obj), value)),
        }
    },
    pipe: (...lenses: Lens<any, any>[]): Lens<any, any> => {
        return lenses.reduce((acc, lens) => Lens.compose(acc, lens))
    },
    each: <T, U>(lens: Lens<T, U>): Lens<T[], U[]> => {
        return {
            get: (obj: T[]) => obj.map(item => lens.get(item)),
            set: (obj: T[], value: U[]) => {
                return obj.map((item, index) => lens.set(item, value[index]))
            },
        }
    },
}
