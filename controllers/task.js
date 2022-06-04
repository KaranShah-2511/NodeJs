import Task from "../models/Task.js"

class Tasks {
    static getAllTasks = async (req, res) => {
        try {
            const getAllTasks = await Task.find()
            res.status(200).json({ getAllTasks })

        } catch (error) {
            res.status(500).json({ error })
        }
        // res.send('Get All Tasks')

    }
    static createTask = async (req, res) => {

        try {
            const task = await Task.create(req.body)
            res.status(200).json({ task })

        } catch (error) {
            res.status(500).json({ error })

        }

    }
    static updateTask = async (req, res) => {
        // res.send('Update Task')
        try {
            const updateTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
            res.status(200).json({ updateTask })

        } catch (error) {
            res.status(500).json({ error })
        }
    }
    static deleteTask = async (req, res) => {
        try {
            const deleteTask = await Task.findByIdAndDelete(req.params.id)
            res.json({ deleteTask })

        } catch (error) {
            res.status(500).json({ error })
        }


        // res.send('Delete Task')
    }
    static getTaskById = async (req, res) => {
        try {
            const task = await Task.findById(req.params.id)
            res.json({ task })

        } catch (error) {
            res.status(500).json({ error })
        }

        // res.send('Get Task By Id')
    }


}

export default Tasks;