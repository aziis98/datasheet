import { useState } from "preact/hooks"
import { Lens } from "./lenses"

export class Optic<T> {
    #value: T
    #updater: (updater: (current: T) => T) => void

    constructor(value: T, updater: (updater: (current: T) => T) => void) {
        this.#value = value
        this.#updater = updater
    }

    update(updater: (current: T) => T) {
        this.#updater(updater)
    }

    get(): T {
        return this.#value
    }

    set(value: T) {
        this.#updater(() => value)
    }

    lens<K>(lens: Lens<T, K>): Optic<K> {
        return new Optic<K>(lens.get(this.#value), updater => {
            this.#updater(current => lens.set(current, updater(lens.get(current))))
        })
    }

    prop<K extends keyof T>(key: K): Optic<T[K]> {
        return this.lens(Lens.prop(key))
    }

    at(index: number): Optic<T extends Array<infer U> ? U : never> {
        return this.lens(Lens.at(index) as any)
    }

    // each<U>(
    //     l: Lens<T extends Array<infer V> ? V : never, U> = Lens.Identity<T extends Array<infer V> ? V : never>()
    // ): Optic<U[]> {
    //     return this.lens(Lens.each(l) as any)
    // }

    /**
     * For Optic<T[]> types, returns an array of Optic<T> for each item.
     */
    items(): Optic<T extends Array<infer U> ? U : never>[] {
        const array = this.get() as unknown as Array<any>
        return array.map((_, index) => this.at(index)) as unknown as Optic<T extends Array<infer U> ? U : never>[]
    }

    /**
     * For Optic<T> where T is an object type, returns an array of [key, Optic<value>] pairs.
     */
    entries(): [string, Optic<T[keyof T]>][] {
        const obj = this.#value as unknown as Record<string, any>
        return Object.keys(obj).map(key => [key, this.prop(key as keyof T)] satisfies [string, Optic<T[keyof T]>])
    }

    /**
     * For Optic<T> where T is an object type, returns an array of [Optic<key>, Optic<value>] pairs.
     */
    entriesKV(): [Optic<keyof T>, Optic<T[keyof T]>][] {
        const obj = this.#value as unknown as Record<string, any>
        return Object.keys(obj).map<[Optic<keyof T>, Optic<T[keyof T]>]>(stringKey => {
            const key = stringKey as keyof T

            return [
                new Optic<keyof T>(key, updater => {
                    this.#updater(current => {
                        const value = current[key]
                        const newKey = updater(key)
                        if (newKey === key) {
                            return current
                        }
                        const { [key]: _, ...rest } = current as any
                        return {
                            ...rest,
                            [newKey]: value,
                        } as T
                    })
                }),
                this.prop(key),
            ]
        })
    }

    asHook(): [T, (value: T | ((current: T) => T)) => void] {
        return [
            this.#value,
            (value: T | ((current: T) => T)) => {
                if (typeof value === "function") {
                    this.#updater(value as (current: T) => T)
                } else {
                    this.#updater(() => value as T)
                }
            },
        ]
    }
}

export const useOpticState = <T>(initialValue: T) => {
    const [value, setValue] = useState<T>(initialValue)

    return new Optic<T>(value, updater => {
        setValue(current => updater(current))
    })
}
