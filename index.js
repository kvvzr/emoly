import kuromoji from 'kuromoji'
import readline from 'readline'
import w2v from 'word2vec'

import emojis from './data/emojis'
 
const dicPath = 'node_modules/kuromoji/dist/dict/'
const modelPath = 'data/wiki.txt'
const allowPos = ['名詞', '動詞', '形容詞', '副詞']

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

const joinTokens = (tokens) => {
    return new Promise((resolve, reject) => {
        let result = []
        let verb = null
        for (let token of tokens) {
            let pos = token['pos']
            if (verb && (pos == '助詞' || pos == '助動詞')) {
                verb['surface_form'] += token['surface_form']
                continue
            }
            if (pos == '動詞') {
                verb = token
                continue
            }
            if (verb) {
                result.push(verb)
                verb = null
            }
            result.push(token)
        }
        if (verb) {
            result.push(verb)
        }
        resolve(result)
    })
}

const emolize = (model, words) => {
    return new Promise((resolve, reject) => {
        let text = ''
        for (let word of words) {
            let pos = word['pos']
            let surface = word['surface_form']
            let basic = word['basic_form'] == '*' ? surface : word['basic_form']
            if (allowPos.indexOf(pos) == -1 || pos == '記号') {
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
                .then(joinTokens)
                .then((words) => { return emolize(model, words) })
                .then(console.log)
        })
    })
    .catch(console.log)
