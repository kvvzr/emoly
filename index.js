import kuromoji from 'kuromoji'
import w2v from 'word2vec'

import emojis from './emojis'
 
const dicPath = 'node_modules/kuromoji/dist/dict/'
const modelPath = 'data/wiki.txt'

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

const emolize = (words) => {
    return new Promise((resolve, reject) => {
        w2v.loadModel(modelPath, (err, model) => {
            if (err) {
                reject(err)
            }
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
    })
}

if (process.argv.length == 3) {
    tokenize(process.argv[2])
        .then(emolize)
        .then(console.log)
        .catch(console.log)
}

