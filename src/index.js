function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = '';
    t.classList.add('show', `toast-${type}`);
    setTimeout(() => t.classList.remove('show'), 2500);
}

document.querySelectorAll('input[name="src"]').forEach(r => {
    r.addEventListener('change', () => {
        const isFile = r.value === 'file';
        document.getElementById('src-text-area').classList.toggle('hidden', isFile);
        document.getElementById('src-file-area').classList.toggle('hidden', !isFile);
        document.getElementById('out-hash').closest('.form-group').classList.toggle('hidden', isFile);
    });
});

document.getElementById('btn-open-file').addEventListener('click', () => {
    document.getElementById('inp-file').click();
});

document.getElementById('inp-file').addEventListener('change', e => {
    const f = e.target.files[0];
    document.getElementById('file-name').textContent = f ? f.name : 'Файл не выбран';
    updateHashPreviewFromFile();
});

document.getElementById('btn-open-ver').addEventListener('click', () => {
    document.getElementById('ver-file').click();
});

document.getElementById('ver-file').addEventListener('change', e => {
    const f = e.target.files[0];
    document.getElementById('ver-file-name').textContent = f ? f.name : 'Файл не выбран';
});

function fastExp(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    if (base < 0n) base += mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = result * base % mod;
        exp >>= 1n;
        base = base * base % mod;
    }
    return result;
}

function extGcd(a, b) {
    if (b === 0n) return { g: a, x: 1n, y: 0n };
    const { g, x, y } = extGcd(b, a % b);
    return { g, x: y, y: x - (a / b) * y };
}

function modInverse(a, m) {
    const { g, x } = extGcd(((a % m) + m) % m, m);
    if (g !== 1n) return undefined;
    return ((x % m) + m) % m;
}

function isPrime(n) {
    if (n < 2n) return false;
    if (n === 2n || n === 3n || n === 5n || n === 7n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;
    for (let i = 5n; i * i <= n; i += 6n) {
        if (n % i === 0n || n % (i + 2n) === 0n) return false;
    }
    return true;
}

function gcd(a, b) {
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

function charToNum(ch) {
    const upper = ch.toUpperCase();
    const RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const idx = RU.indexOf(upper);
    if (idx !== -1) return BigInt(idx + 1);
    return BigInt(ch.charCodeAt(0));
}

function computeHash(message, n, steps) {
    let H = 100n;
    if (steps) {
        steps.push(`H₀ = 100`);
    }
    if (message.length === 0) {
        if (steps) steps.push('Сообщение пустое');
        return H;
    }
    for (let i = 0; i < message.length; i++) {
        const Mi = charToNum(message[i]);
        const prev = H;
        H = (prev + Mi) * (prev + Mi) % n;
        if (steps) steps.push(`H${i + 1} = (${prev} + ${Mi})² mod ${n} = ${H} - символ '${message[i]}'`);
    }
    return H;
}

function computeHashBytes(bytesArray, n) {
    let H = 100n;
    for (let i = 0; i < bytesArray.length; i++) {
        const Mi = BigInt(bytesArray[i]);
        H = (H + Mi) * (H + Mi) % n;
    }
    return H;
}

function validatePrime(val, hintEl, inputEl) {
    const n = BigInt(val);
    if (!isPrime(n)) {
        hintEl.textContent = `${val} не является простым`;
        hintEl.className = 'field-hint';
        inputEl.classList.add('error');
        return null;
    }
    hintEl.textContent = `${val} простое`;
    hintEl.className = 'field-hint ok';
    inputEl.classList.remove('error');
    return n;
}

document.getElementById('btn-compute-keys').addEventListener('click', () => {
    const pVal = document.getElementById('inp-p').value.trim();
    const qVal = document.getElementById('inp-q').value.trim();
    const dVal = document.getElementById('inp-d').value.trim();
    if (!pVal || !qVal || !dVal) {
        showToast('Введите p, q и d', 'error');
        return;
    }
    const p = validatePrime(pVal, document.getElementById('hint-p'), document.getElementById('inp-p'));
    const q = validatePrime(qVal, document.getElementById('hint-q'), document.getElementById('inp-q'));
    if (!p || !q) return;
    if (p === q) {
        document.getElementById('hint-q').textContent = 'p и q должны быть различными';
        document.getElementById('hint-q').className = 'field-hint';
        return;
    }
    const dNum = BigInt(dVal);
    const r = p * q;
    const phi = (p - 1n) * (q - 1n);
    const hintD = document.getElementById('hint-d');
    const inpD = document.getElementById('inp-d');
    if (dNum < 0n) {
        hintD.textContent = `d должно быть положительным числом`;
        hintD.className = 'field-hint';
        inpD.classList.add('error');
        return;
    }
    const e = modInverse(dNum, phi);
    if (e === undefined || e === 1n || gcd(e, phi) !== 1n) {
        hintD.textContent = `Для этого d нельзя найти корректный e. Попробуйте другое d`;
        hintD.className = 'field-hint';
        inpD.classList.add('error');
        return;
    }
    hintD.textContent = `e·d mod φ(r) = ${e}·${dNum} mod ${phi} = 1`;
    hintD.className = 'field-hint ok';
    inpD.classList.remove('error');
    window._keys = { p, q, r, phi, e, d: dNum };
    document.getElementById('out-r').textContent = r.toString();
    document.getElementById('out-phi').textContent = phi.toString();
    document.getElementById('out-e').textContent = e.toString();
    document.getElementById('out-ko').textContent = `(${e}, ${r})`;
    document.getElementById('out-kc').textContent = `(${dNum}, ${r})`;
    document.getElementById('computed-keys').classList.remove('hidden');
    updateHashPreview();
});

document.getElementById('inp-message').addEventListener('input', updateHashPreview);

function updateHashPreview() {
    const keys = window._keys;
    if (!keys) return;
    const msg = document.getElementById('inp-message').value;
    const h = computeHash(msg, keys.r, null);
    document.getElementById('out-hash').textContent = h.toString();
}

async function updateHashPreviewFromFile() {
    const keys = window._keys;
    if (!keys) return;
    try {
        const fileData = await readFile(document.getElementById('inp-file'));
        const h = fileData.binary
            ? computeHashBytes(fileData.bytes, keys.r)
            : computeHash(fileData.text, keys.r, null);
        document.getElementById('out-hash').textContent = h.toString();
    } catch (_) {}
}

function readFile(input) {
    return new Promise((resolve, reject) => {
        if (!input.files || !input.files.length) {
            reject('Файл не выбран');
            return;
        }
        const file = input.files[0];
        const isBinary = !file.name.toLowerCase().endsWith('.txt');
        if (isBinary) {
            const reader = new FileReader();
            reader.onload = e => resolve({ binary: true, bytes: new Uint8Array(e.target.result), name: file.name });
            reader.onerror = () => reject('Ошибка чтения файла');
            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();
            reader.onload = e => resolve({ binary: false, text: e.target.result, name: file.name });
            reader.onerror = () => reject('Ошибка чтения файла');
            reader.readAsText(file, 'UTF-8');
        }
    });
}

function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('btn-sign').addEventListener('click', async () => {
    const keys = window._keys;
    if (!keys) {
        showToast('Сначала вычислите параметры ключей', 'error');
        return;
    }
    const { p, q, r, d } = keys;
    const steps = [];
    let hashVal, S, filename;
    const src = document.querySelector('input[name="src"]:checked').value;
    if (src === 'text') {
        const message = document.getElementById('inp-message').value;
        hashVal = computeHash(message, r, steps);
        steps.push(`m=${hashVal}, d=${d}, r=${r}`);
        S = fastExp(hashVal, d, r);
        steps.push(`S = ${S}`);
        filename = 'message.txt';
        const content = message + '\n---SIGNATURE---\n' + S.toString();
        downloadText(filename, content);
    } else {
        let fileData;
        try {
            fileData = await readFile(document.getElementById('inp-file'));
        }
        catch (err) {
            showToast(err, 'error');
            return;
        }
        if (fileData.binary) {
            hashVal = computeHashBytes(fileData.bytes, r);
            steps.push(`m=${hashVal}, d=${d}, r=${r}`);
            S = fastExp(hashVal, d, r);
            steps.push(`S = ${S}`);
            filename = fileData.name;
            const MARKER = ':::SIGNATURE:::';
            const sigBytes = new TextEncoder().encode(MARKER + S.toString());
            const blob = new Blob([fileData.bytes, sigBytes]);
            downloadBlob(blob, filename);
        } else {
            const message = fileData.text;
            hashVal = computeHash(message, r, steps);
            steps.push(`m=${hashVal}, d=${d}, r=${r}`);
            S = fastExp(hashVal, d, r);
            steps.push(`S = ${S}`);
            filename = fileData.name;
            const content = message + '\n---SIGNATURE---\n' + S.toString();
            downloadText(filename, content);
        }
    }
    document.getElementById('res-hash').textContent = hashVal.toString();
    document.getElementById('res-sig').textContent  = S.toString();
    document.getElementById('sign-steps').textContent = steps.join('\n');
    document.getElementById('sign-result').classList.remove('hidden');
    showToast('Файл подписан и сохранён', 'success');
});

document.getElementById('btn-verify').addEventListener('click', async () => {
    const eVal = document.getElementById('ver-e').value.trim();
    const rVal = document.getElementById('ver-r').value.trim();
    if (!eVal || !rVal) {
        showToast('Заполните все поля', 'error');return;
    }
    const eV = BigInt(eVal);
    const rV = BigInt(rVal);
    let fileData;
    try {
        fileData = await readFile(document.getElementById('ver-file'));
    }
    catch (err) {
        showToast(err, 'error');
        return;
    }
    const result = document.getElementById('verify-result');
    const verdict = document.getElementById('verify-verdict');
    const steps = [];
    let hashNew, S, hashDec;
    if (fileData.binary) {
        const MARKER = ':::SIGNATURE:::';
        const markerBytes = new TextEncoder().encode(MARKER);
        const bytes = fileData.bytes;
        let markerIndex = -1;
        for (let i = bytes.length - markerBytes.length; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < markerBytes.length; j++) {
                if (bytes[i + j] !== markerBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                markerIndex = i;
                break;
            }
        }
        if (markerIndex === -1) {
            verdict.className = 'verify-verdict invalid';
            verdict.textContent = 'Маркер подписи не найден в файле';
            verdict.classList.remove('hidden');
            result.classList.remove('hidden');
            return;
        }
        const originalBytes = bytes.slice(0, markerIndex);
        const sigStr = new TextDecoder().decode(bytes.slice(markerIndex + markerBytes.length)).trim();
        try {
            S = BigInt(sigStr);
        }
        catch {
            verdict.className = 'verify-verdict invalid';
            verdict.textContent = 'Не удалось прочитать подпись из файла';
            verdict.classList.remove('hidden');
            result.classList.remove('hidden');
            return;
        }
        steps.push(`S = ${S}`);
        hashNew = computeHashBytes(originalBytes, rV);

    } else {
        const DELIM = '\n---SIGNATURE---\n';
        const delimIdx = fileData.text.lastIndexOf(DELIM);
        if (delimIdx === -1) {
            verdict.className = 'verify-verdict invalid';
            verdict.textContent = 'Разделитель ---SIGNATURE--- не найден';
            verdict.classList.remove('hidden');
            result.classList.remove('hidden');
            return;
        }
        const msgPart = fileData.text.substring(0, delimIdx);
        const sigPart = fileData.text.substring(delimIdx + DELIM.length).trim();
        try {
            S = BigInt(sigPart);
        }
        catch {
            verdict.className = 'verify-verdict invalid';
            verdict.textContent = 'Подпись не является целым числом';
            verdict.classList.remove('hidden');
            result.classList.remove('hidden');
            return;
        }
        steps.push(`S = ${S}`);
        hashNew = computeHash(msgPart, rV, steps);
    }
    hashDec = fastExp(S, eV, rV);
    steps.push(`m = S^e mod r = ${S}^${eV} mod ${rV} = ${hashDec}`);
    steps.push(`h(M') = ${hashNew},  m = ${hashDec}`);
    document.getElementById('vres-sig').textContent = S.toString();
    document.getElementById('vres-hash-new').textContent = hashNew.toString();
    document.getElementById('vres-hash-dec').textContent = hashDec.toString();
    document.getElementById('verify-steps').textContent = steps.join('\n');
    if (hashNew === hashDec) {
        verdict.className = 'verify-verdict valid';
        verdict.textContent = `Подпись верна (h(M') = m = ${hashNew})`;
    } else {
        verdict.className = 'verify-verdict invalid';
        verdict.textContent = `Подпись неверна (h(M') = ${hashNew} ≠ m = ${hashDec})`;
    }
    verdict.classList.remove('hidden');
    result.classList.remove('hidden');
});