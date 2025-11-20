import type { RefObject } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { Lens } from "./lenses"

export type UpdaterFn<T> = (updater: (current: T) => T) => void

export class Optic<T> {
    #value: T
    #updater?: UpdaterFn<T>

    static of<T>(value: T, updater?: UpdaterFn<T>) {
        return new Optic<T>(value, updater)
    }

    constructor(value: T, updater?: UpdaterFn<T>) {
        this.#value = value
        this.#updater = updater
    }

    get isReadonly(): boolean {
        return this.#updater === undefined
    }

    get isUpdatable(): boolean {
        return this.#updater !== undefined
    }

    update = (updater: (current: T) => T) => {
        if (!this.#updater) {
            throw new Error("Cannot update a readonly Optic")
        }

        this.#updater(updater)
    }

    get = (): T => {
        return this.#value
    }

    set = (value: T) => {
        this.update(() => value)
    }

    map<U>(mapTo: (value: T) => U, mapBack: (value: U) => T): Optic<U> {
        return Optic.of<U>(
            mapTo(this.#value),
            this.isUpdatable
                ? updater => {
                      this.update(current => mapBack(updater(mapTo(current))))
                  }
                : undefined
        )
    }

    trySubtype<U extends T>(check: (value: T) => value is U): Optic<U> | null {
        if (!check(this.#value)) {
            return null
        }

        return Optic.of(
            this.#value,
            this.isUpdatable
                ? updater => {
                      this.update(current => {
                          const subValue = current as U
                          return updater(subValue)
                      })
                  }
                : undefined
        )
    }

    lens<K>(lens: Lens<T, K>): Optic<K> {
        return Optic.of<K>(
            lens.get(this.#value),
            this.isUpdatable
                ? updater => {
                      this.update(current => lens.set(current, updater(lens.get(current))))
                  }
                : undefined
        )
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

    arrayAppend(...items: T extends Array<infer U> ? U[] : never[]) {
        this.update(current => {
            if (Array.isArray(current)) {
                return [...current, ...items] as T
            }
            return current
        })
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
                Optic.of<keyof T>(
                    key,
                    this.isUpdatable
                        ? updater => {
                              this.update(current => {
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
                          }
                        : undefined
                ),
                this.prop(key),
            ]
        })
    }

    asHook(): [T, (value: T | ((current: T) => T)) => void] {
        return [
            this.#value,
            (value: T | ((current: T) => T)) => {
                if (typeof value === "function") {
                    this.update(value as (current: T) => T)
                } else {
                    this.update(() => value as T)
                }
            },
        ]
    }
}

export const useOpticState = <T>(initialValue: T) => {
    const [value, setValue] = useState<T>(initialValue)

    return Optic.of<T>(value, updater => {
        setValue(current => updater(current))
    })
}

export const useEventListener = <K extends keyof WindowEventMap>(
    element: Window,
    eventName: K,
    handler: (event: WindowEventMap[K]) => void
) => {
    const savedHandler = useRef<(event: WindowEventMap[K]) => void>()
    savedHandler.current = handler

    useEffect(() => {
        const eventListener = (event: WindowEventMap[K]) => {
            savedHandler.current?.(event)
        }

        element.addEventListener(eventName, eventListener)

        return () => {
            element.removeEventListener(eventName, eventListener)
        }
    }, [eventName, element])
}

export const useClickOutside = (ref: RefObject<HTMLElement>, handler: (event: MouseEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener("pointerdown", listener)

        return () => {
            document.removeEventListener("pointerdown", listener)
        }
    }, [ref, handler])
}

export const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    }

    return [storedValue, setValue] as const
}

export const useTimer = (interval: number, callback: () => void) => {
    const savedCallback = useRef<() => void>()
    savedCallback.current = callback

    useEffect(() => {
        const tick = () => {
            savedCallback.current?.()
        }

        if (interval !== null) {
            const id = setInterval(tick, interval)
            return () => clearInterval(id)
        }
    }, [interval])
}

export const useKeyPress = (e: (event: KeyboardEvent) => boolean) => {
    const [pressed, setPressed] = useState(false)

    useEffect(() => {
        const downHandler = (event: KeyboardEvent) => {
            if (e(event)) {
                setPressed(true)
            }
        }

        const upHandler = (event: KeyboardEvent) => {
            if (e(event)) {
                setPressed(false)
            }
        }

        window.addEventListener("keydown", downHandler)
        window.addEventListener("keyup", upHandler)

        return () => {
            window.removeEventListener("keydown", downHandler)
            window.removeEventListener("keyup", upHandler)
        }
    }, [e])

    return pressed
}
