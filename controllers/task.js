

class Tasks {
    static getAllTasks = (req, res) => {
        res.send('Get All Tasks')

    }
    static createTask = (req, res) => {
        res.send('Create Task')
    }
    static updateTask = (req, res) => {
        res.send('Update Task')
    }
    static deleteTask = (req, res) => {
        res.send('Delete Task')
    }
    static getTaskById = (req, res) => {
        res.send('Get Task By Id')
    }


}

export default Tasks;