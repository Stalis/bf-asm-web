"use strict"

const Opcodes = {
	NOP: 0,
	ADD: 1,
	SUB: 2,
	SHL: 3,
	SHR: 4,
	SCN: 5,
    PRN: 6,
    STL: 7,
    EDL: 8,
    HLT: 255,

	fromStr(str) {
		switch(str) {
			case "+":
				return Opcodes.ADD;
			case "-":
				return Opcodes.SUB;
			case "<":
				return Opcodes.SHL;
			case ">":
				return Opcodes.SHR;
			case ".":
				return Opcodes.PRN;
			case ",":
                return Opcodes.SCN;
            case "[":
                return Opcodes.STL;
            case "]":
                return Opcodes.EDL;
			default:
				return Opcodes.NOP;
		}
	}
};

class VirtualMachine {
	constructor(){
		this._pc = 0;
		this._memPtr = 0;
		this._program = [];
		this._memory = new Array(16);
        this._memory.fill(0);
        this._stack = [];
        this._stdin = [];
        this._stdout = [];
	}

	get pc() {
		return this._pc;
	}

	get memoryPointer() {
		return this._memPtr;
	}

	get memory() {
		return this._memory;
    }

    get stdout() {
        return this._stdout;
    }

	get program() {
		return this._program;
    }

	loadCode(data) {
		if (Array.isArray(data)) {
		    this._program = [];
            data.forEach((v) => this._program.push(Opcodes.fromStr(v)));
            this._program.push(Opcodes.HLT);
		}
    }

    loadInput(input) {
        if (typeof input === "string") {
            this._stdin = [];
            for (var i = 0; i < input.length; i++) {
                this._stdin.push(input.charCodeAt(i));
            };
        }

        this._stdin.reverse();
    }

	reset() {
		this._pc = 0;
		this._memPtr = 0;
        this._memory.fill(0);
        this._stack = [];
        this._stdout = [];
	}

    fetchByte() {
		let res = this._program[this._pc];
		this._pc += 1;
		return res;
	}

    runCommand(op) {
        var buf = 0;
		switch (op) {
			case Opcodes.NOP:
				break;
            case Opcodes.ADD:
                buf = this._memory[this._memPtr] + 1;
                this._memory[this._memPtr] = buf > 255 ? 0 : buf;
				break;
			case Opcodes.SUB:
                buf = this._memory[this._memPtr] - 1;
                this._memory[this._memPtr] = buf < 0 ? 255 : buf;
				break;
            case Opcodes.SHL:
                buf = this._memPtr - 1;
                this._memPtr = buf < 0 ? this._memory.length - 1 : buf;
				break;
            case Opcodes.SHR:
                buf = this._memPtr + 1;
                this._memPtr = buf > this._memory.length - 1 ? this.memory.length - 1 : buf;
				break;
            case Opcodes.SCN:
                buf = this._stdin.pop();
                this._memory[this._memPtr] = buf ? buf : 0;
				break;
            case Opcodes.PRN:
                this._stdout.push(this._memory[this._memPtr]);
                break;
            case Opcodes.STL:
                this._stack.push(this._pc);
                break;
            case Opcodes.EDL:
                if (this._memory[this._memPtr]) {
                    buf = this._stack[this._stack.length - 1];
                    this._pc = buf ? buf : 0;
                } else {
                    this._stack.pop();
                }
                break;
			default:
				console.log("Invalid opcode");
				break;
		}
	}

	step() {
		let op = this.fetchByte();
		if (op === undefined)
			return;
		this.runCommand(op);
	}

	run() {
		this.reset();
		var op = Opcodes.NOP;
		while ((op = this.fetchByte()) !== undefined) {
			this.runCommand(op);
		}
	}
}

class BrainfuckAsm {
    transpile() {
        return (
        "++++++++++[> +++++++> " +
        "++++++++++> +++>" +
        "+<<<< -] > ++ .>" +
        "+.+++++++..++ +.> ++.<< " +
        "+++++++++++++++.>.++ +." +
        "------.--------.> +.>.");
	}
}

const UnselectedCellClasses = ["memory-cell"];
const SelectedCellClasses = ["memory-cell chosen-cell"];

let controls = {
    memStateDiv: null,
    memStateCells: [],
    pcStateDiv: null,
    memPtrStateDiv: null,
    stdinText: null,
    stdoutText: null,
	asmText: null,
	bfText: null,
	vmRunBtn: null,
	vmStepBtn: null,
    asmTranBtn: null,

    updateMemCells(data) {
        if (!Array.isArray(data))
            return;
        data.forEach((v, i) => {
            if (i < this.memStateCells.length) {
                this.memStateCells[i].innerText = v;
            }
        });
    },

    changeMemCell(pos) {
        for (var i = 0; i < this.memStateCells.length; i++) {
            if (pos === i) {
                this.memStateCells[i].classList = SelectedCellClasses;
            } else {
                this.memStateCells[i].classList = UnselectedCellClasses;
            }
        }
    },

    updatePcState(val) {
        this.pcStateDiv.innerText = val;
    },

    updateMemPtrState(val) {
        this.memPtrStateDiv.innerText = val;
        this.changeMemCell(val);
    },
};

let model = {
	vm: null,
	asm: null,
	asmSrc: "",
    bfSrc: "",
    vmInput: "",
	get memory() {
		return this.vm.memory;
	},
	get pc() {
		return this.vm.pc;
	},
	get memoryPointer() {
		return this.vm.memoryPointer;
    },
    get stdout() {
        return String.fromCharCode(...this.vm.stdout);
    },
	vmStep() {
		this.vm.step();
	},
    vmRun() {
        this.loadCode();
        this.loadInput();
		this.vm.run();
	},
	loadCode() {
        this.vm.loadCode(Array.from(this.bfSrc));
        this.vm.reset();
    },
    loadInput() {
        this.vm.loadInput(this.vmInput);
        this.vm.reset();
    },
	transpile() {
		this.bfSrc = this.asm.transpile(this.asmSrc);
	},
};

function updateVmView() {
    controls.updateMemCells(model.memory);
    controls.updateMemPtrState(model.memoryPointer);
    controls.updatePcState(model.pc);
    controls.stdoutText.value = model.stdout;
}

const Handlers = {
	vmStep() {
		console.log("VM Step!");
        model.vmStep();
        updateVmView();
    },

	vmRun() {
        console.log("VM Run!");
        model.vmRun();
        updateVmView();
	},

	vmLoad() {
        model.loadCode();
        model.loadInput();
        updateVmView();
    },

    vmInput() {
        model.vmInput = controls.stdinText.value;
    },

	asmTranspile() {
		console.log("ASM Transpile");
		model.transpile();
		controls.bfText.value = model.bfSrc;
	},

	asmInput() {
		model.asmSrc = controls.asmText.value;
	},

	bfInput() {
		model.bfSrc = controls.bfText.value;
	},
}


function initControls() {
    controls.memStateDiv = document.getElementById("memory_blocks");
    let cellTemp = document.createElement('div');
    cellTemp.classList.add("memory-cell");
    model.memory.forEach((v) => {
        let cell = cellTemp.cloneNode();
        cell.innerText = v;
        controls.memStateCells.push(controls.memStateDiv.appendChild(cell));
    });

    controls.pcStateDiv = document.getElementById("text_vmPc");
    controls.memPtrStateDiv = document.getElementById("text_vmMemPtr");

    controls.stdinText = document.getElementById("text_stdin");
    controls.stdoutText = document.getElementById("text_stdout");

	controls.asmText = document.getElementById("text_bfasm");
	controls.bfText = document.getElementById("text_bfsrc");
	controls.vmRunBtn = document.getElementById("button_vmRun");
	controls.vmStepBtn = document.getElementById("button_vmStep");
	controls.asmTranBtn = document.getElementById("button_bfAsmTranspile");
    controls.loadBtn = document.getElementById("button_loadToVm");

    model.vmInput = controls.stdinText.value;
    model.asmSrc = controls.asmText.value;
    model.bfSrc = controls.bfText.value;
    updateVmView();
}

function initEvents() {
    controls.stdinText.oninput = Handlers.vmInput;
	controls.asmText.oninput = Handlers.asmInput;
	controls.bfText.oninput = Handlers.bfInput;
	controls.vmRunBtn.onclick = Handlers.vmRun;
	controls.vmStepBtn.onclick = Handlers.vmStep;
	controls.asmTranBtn.onclick = Handlers.asmTranspile;
	controls.loadBtn.onclick = Handlers.vmLoad;
}

function initModel() {
	model.vm = new VirtualMachine();
    model.asm = new BrainfuckAsm();
}

function initView() {
	initModel();
	initControls();
	initEvents();
}


window.onload = initView;
