import kuromoji from 'kuromoji'
import readline from 'readline'
import w2v from 'word2vec'

import emojis from './emojis'
 
const dicPath = 'node_modules/kuromoji/dist/dict/'
const modelPath = 'data/wiki.txt'

const loop = (fn) => {
    fn().then(() => { loop(fn) })
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const inputLyrics = () => {
    return new Promise((resolve, reject) => {
        rl.question('> ', (lyrics) => {
            resolve(lyrics)
        })
    })
}

const loadModel = () => {
    return new Promise((resolve, reject) => {
        w2v.loadModel(modelPath, (err, model) => {
            if (err) {
                reject(err)
            }
            resolve(model)
        })
    })
}

const tokenize = (text) => {
    return new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath: dicPath }).build((err, tokenizer) => {
            if (err) {
                reject(err)
            }
            let tokens = tokenizer.tokenize(text)
            resolve(tokens)
        })
    })
}

const emolize = (model, words) => {
    return new Promise((resolve, reject) => {
        let text = ''
        for (let word of words) {
            let surface = word['surface_form']
            let basic = word['basic_form'] == '*' ? surface : word['basic_form']
            if (surface == ' ') {
                text += surface
                continue
            }

            let maxSim = 0.2 // 0.2より大きければ採用
            let maxEmoji = ''
            for (let emoji of emojis) {
                if (surface == emoji.name) {
                    maxEmoji = emoji.surface
                    break
                }
                let sim = model.similarity(basic, emoji.name)
                if (maxSim < sim) {
                    maxSim = sim
                    maxEmoji = emoji.surface
                }
            }
            text += surface
            if (maxEmoji) {
                text += maxEmoji + ' '
            }
        }
        resolve(text)
    })
}

loadModel()
    .then((model) => {
        loop(() => {
            return inputLyrics()
                .then(tokenize)
                .then((words) => { return emolize(model, words) })
                .then(console.log)
        })
    })
    .catch(console.log)
