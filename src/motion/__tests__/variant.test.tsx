import "../../../jest.setup"
import { render } from "react-testing-library"
import { motion } from "../"
import * as React from "react"
import { Variants } from "../../types"
import { motionValue } from "../../value"

describe("animate prop as variant", () => {
    const variants: Variants = {
        hidden: { opacity: 0, x: -100, transition: { type: false } },
        visible: { opacity: 1, x: 100, transition: { type: false } },
    }
    const childVariants: Variants = {
        hidden: { opacity: 0, x: -100, transition: { type: false } },
        visible: { opacity: 1, x: 50, transition: { type: false } },
    }

    test("animates to set variant", async () => {
        const promise = new Promise(resolve => {
            const x = motionValue(0)
            const onComplete = () => resolve(x.get())
            const { rerender } = render(
                <motion.div
                    animate="visible"
                    variants={variants}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )
            rerender(
                <motion.div
                    animate="visible"
                    variants={variants}
                    style={{ x }}
                    onAnimationComplete={onComplete}
                />
            )
        })

        return expect(promise).resolves.toBe(100)
    })

    test("child animates to set variant", async () => {
        const promise = new Promise(resolve => {
            const x = motionValue(0)
            const onComplete = () => resolve(x.get())
            const Component = () => (
                <motion.div
                    animate="visible"
                    variants={variants}
                    onAnimationComplete={onComplete}
                >
                    <motion.div variants={childVariants} style={{ x }} />
                </motion.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(50)
    })

    test("child animates to set variant even if variants are not found on parent", async () => {
        const promise = new Promise(resolve => {
            const x = motionValue(0)
            const onComplete = () => resolve(x.get())
            const Component = () => (
                <motion.div animate="visible" onAnimationComplete={onComplete}>
                    <motion.div variants={childVariants} style={{ x }} />
                </motion.div>
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe(50)
    })

    test("applies applyOnEnd if set on initial", () => {
        const variants: Variants = {
            visible: {
                background: "#f00",
                transitionEnd: { display: "none" },
            },
        }

        const { container } = render(
            <motion.div variants={variants} initial="visible" />
        )
        expect(container.firstChild).toHaveStyle("display: none")
    })

    test("applies applyOnEnd and end of animation", async () => {
        const promise = new Promise(resolve => {
            const variants: Variants = {
                hidden: { background: "#00f" },
                visible: {
                    background: "#f00",
                    transitionEnd: { display: "none" },
                },
            }
            const display = motionValue("block")
            const onComplete = () => resolve(display.get())
            const Component = () => (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={variants}
                    transition={{ type: false }}
                    onAnimationComplete={onComplete}
                    style={{ display }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("none")
    })

    test("accepts custom transition", async () => {
        const promise = new Promise(resolve => {
            const variants: Variants = {
                hidden: { background: "#00f" },
                visible: {
                    background: "#f00",
                    transition: { to: "#555" },
                },
            }
            const background = motionValue("#00f")
            const onComplete = () => resolve(background.get())
            const Component = () => (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={variants}
                    transition={{ type: false }}
                    onAnimationComplete={onComplete}
                    style={{ background }}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toBe("rgba(85, 85, 85, 1)")
    })

    test("respects orchestration props in transition prop", async () => {
        const promise = new Promise(resolve => {
            const opacity = motionValue(0)
            const variants: Variants = {
                visible: {
                    opacity: 1,
                },
                hidden: {
                    opacity: 0,
                },
            }

            render(
                <motion.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    transition={{ type: false, delayChildren: 1 }}
                >
                    <motion.div
                        variants={variants}
                        transition={{ type: false }}
                        style={{ opacity }}
                    />
                </motion.div>
            )

            requestAnimationFrame(() => resolve(opacity.get()))
        })

        return expect(promise).resolves.toBe(0)
    })

    test("propagates through components with no `animate` prop", async () => {
        const promise = new Promise(resolve => {
            const opacity = motionValue(0)
            const variants: Variants = {
                visible: {
                    opacity: 1,
                },
            }

            render(
                <motion.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    transition={{ type: false }}
                >
                    <motion.div>
                        <motion.div
                            variants={variants}
                            transition={{ type: false }}
                            style={{ opacity }}
                        />
                    </motion.div>
                </motion.div>
            )

            requestAnimationFrame(() => resolve(opacity.get()))
        })

        return expect(promise).resolves.toBe(1)
    })

    test("components without variants are transparent to stagger order", async () => {
        const promise = new Promise(resolve => {
            const order: number[] = []

            const parentVariants: Variants = {
                visible: {
                    transition: {
                        staggerChildren: 0.1,
                        staggerDirection: -1,
                    },
                },
            }

            const variants: Variants = {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        duration: 0.01,
                    },
                },
            }

            render(
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={parentVariants}
                    onAnimationComplete={() =>
                        requestAnimationFrame(() => resolve(order))
                    }
                >
                    <motion.div>
                        <motion.div
                            variants={variants}
                            onUpdate={() => order.push(1)}
                        />
                        <motion.div
                            variants={variants}
                            onUpdate={() => order.push(2)}
                        />
                    </motion.div>
                    <motion.div>
                        <motion.div
                            variants={variants}
                            onUpdate={() => order.push(3)}
                        />
                        <motion.div
                            variants={variants}
                            onUpdate={() => order.push(4)}
                        />
                    </motion.div>
                </motion.div>
            )
        })

        return expect(promise).resolves.toEqual([4, 3, 2, 1])
    })

    test("onUpdate", async () => {
        const promise = new Promise(resolve => {
            let latest = {}

            const onUpdate = (l: { [key: string]: number | string }) => {
                latest = l
            }

            const Component = () => (
                <motion.div
                    onUpdate={onUpdate}
                    initial={{ x: 0, y: 0 }}
                    animate={{ x: 100, y: 100 }}
                    transition={{ duration: 0.1 }}
                    onAnimationComplete={() => resolve(latest)}
                />
            )

            const { rerender } = render(<Component />)
            rerender(<Component />)
        })

        return expect(promise).resolves.toEqual({ x: 100, y: 100 })
    })

    test("onUpdate doesnt fire if no values have changed", async () => {
        const onUpdate = jest.fn()

        await new Promise(resolve => {
            const x = motionValue(0)
            const Component = ({ xTarget = 0 }) => (
                <motion.div
                    animate={{ x: xTarget }}
                    transition={{ type: false }}
                    onUpdate={onUpdate}
                    style={{ x }}
                />
            )

            const { rerender } = render(<Component xTarget={0} />)
            setTimeout(() => rerender(<Component xTarget={1} />), 30)
            setTimeout(() => rerender(<Component xTarget={1} />), 60)
            setTimeout(() => resolve(), 90)
        })

        expect(onUpdate).toHaveBeenCalledTimes(1)
    })
})