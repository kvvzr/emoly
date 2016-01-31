import kuromoji from 'kuromoji'
import w2v from 'word2vec'
 
const dicPath = 'node_modules/kuromoji/dist/dict/'
const modelPath = 'node_modules/word2vec/src/vectors.txt'
const emojis = {
    'to': '😖',
    'the': 'nya',
    'The': 'Piyo'
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

const emolize = (words) => {
    return new Promise((resolve, reject) => {
        w2v.loadModel(modelPath, (err, model) => {
            if (err) {
                reject(err)
            }
            let text = ''
            for (let word of words) {
                let surface = word['surface_form']
                let maxSim = 0;
                let maxEmoji = '';
                for (let key in emojis) {
                    if (surface == key) {
                        maxEmoji = emojis[key]
                        break
                    }
                    let sim = model.similarity(surface, key)
                    console.log(surface, key, sim)
                    if (maxSim < sim) {
                        maxSim = sim
                        maxEmoji = emojis[key]
                    }
                }
                text += surface
                text += maxEmoji
            }
            resolve(text)
        })
    })
}

tokenize('of The')
    .then(emolize)
    .then(console.log)
    .catch(console.log)

