class Task {
    constructor(priority) {
        this.priority = priority;
    }
}

class SeekTask extends Task {
    constructor(priority, seekee, distThreshold, onComplete) {
        super(priority);
        this.seekee = seekee;
        this.distThreshold = distThreshold;
        this.onComplete = onComplete;
    }

    perform() {
        this.doer.seek(this.seekee, this.priority);
    }

    isComplete() {
        const isComplete = this.completed || this.seekee.removed || (this.distThreshold && distSq(this.seekee.pos.x, this.seekee.pos.y, this.doer.pos.x, this.doer.pos.y) <= this.distThreshold ** 2);
        if (this.onComplete && isComplete) this.onComplete();
        return isComplete;
    }

    markComplete() {
        this.completed = true;
        if (this.onComplete) this.onComplete();
    }
}

class ReachTask extends Task {
    constructor(priority, seekee, distThreshold, onComplete, abandonIf) {
        super(priority);
        this.seekee = seekee;
        this.distThreshold = distThreshold;
        this.onComplete = onComplete;
        this.abandonIf = abandonIf;
    }

    perform() {
        if ((this.abandonIf && this.abandonIf() === true) || this.doer.reach(this.seekee, this.priority, this.distThreshold))
            this.markComplete();
    }

    markComplete() {
        this.completed = true;
        if (this.onComplete) this.onComplete();
    }

    isComplete() {
        return this.completed || this.seekee.removed;
    }
}