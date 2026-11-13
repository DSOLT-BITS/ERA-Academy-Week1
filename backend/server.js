const express = require('express');
const db = require('./db');
const cors = require('cors');

const app = express();
const PORT = 3000;

 app.use(cors());
 app.use(express.json());

//  Root route - Confirms the server is running
app.get('/',(req,res)=>{
    res.send('Backend is running with mySQL');
});

// GET /students - Returns all students from my SQL

app.get('/students', (req,res) =>{
    const sql ='SELECT * FROM students';
    db.query(sql, (error, results)=>{
        if(error){
            console.error("Error Getting Students:", error);
            return res.status(500).json({error:"Failed To Get Students"});
        }
        res.json(results);
    });
});

// POST /students - Receives new student date, Inserts into MySQL
app.post('/students', (req,res) =>{
    const{first_name, last_name, grade_level} = req.body;

    // Valdation - Reject if any field is missing
    if(!first_name || !last_name || !grade_level){
        return res.status(400).json({error:"First Name, Last Name & Grade Level Are Required"});
    }
    const sql = 'INSERT INTO students (first_name, last_name, grade_level) VALUES (?, ?, ?)';
    db.query(sql, [first_name, last_name, grade_level], (error, results) =>{
        if(error){
            console.error ("Error Adding Student:", error);
            return res.status(500).json({error:"Failed To Add Student"});
        }
        res.status(201).json({
            message:"Student Added Successfully",
            studentId: results.insertId
        });
    });
});

// GET /student/:id/assignments - Returns one student's assignment and scores
app.get('/students/:id/assignments', (req,res) =>{
    const { id } = req.params;
    const sql ='SELECT assignments.assignment_name, assignments.due_date, assignments.max_points, student_assignments.score, student_assignments.submitted_date, classes.class_name FROM assignments JOIN classes ON assignments.class_id = classes.id LEFT JOIN student_assignments ON student_assignments.assignment_id = assignments.id AND student_assignments.student_id = ? WHERE assignments.class_id IN (SELECT class_id FROM enrollments WHERE student_id = ?)';
    db.query(sql, [id, id], (error, results)=>{
        if(error){
            console.error("Error Getting Assignments:", error);
            return res.status(500).json({error:"Failed To Get Assignments"});
        }
        res.json(results);
    });
});


// Get /classes - Returns all classes from my SQL
app.get('/classes', (req,res) =>{
    const sql ='SELECT * FROM classes';
    db.query(sql, (error, results)=>{
        if(error){
            console.error("Error Getting Classes:", error);
            return res.status(500).json({error:"Failed To Get Classes"});
        }
        res.json(results);
    });
});

// GET /enrollments - Returns joined data (student_name + class_name)
app.get('/enrollments', (req,res) =>{
    const sql ='SELECT students.first_name, students.last_name, classes.class_name, classes.teacher_name FROM enrollments JOIN students ON enrollments.student_id = students.id JOIN classes ON enrollments.class_id = classes.id';
    db.query(sql, (error, results)=>{
        if(error){
            console.error("Error Getting Enrollments:", error);
            return res.status(500).json({error:"Failed To Get Enrollments"});
        }
        res.json(results);
    });
});

// GET /students/:id - Returns a single student by ID
app.get('/students/:id', (req,res) =>{
    const { id } = req.params;
    const sql ='SELECT * FROM students WHERE id = ?';
    db.query(sql, [id], (error, results)=>{
        if(error){
            console.error("Error Getting Student:", error);
            return res.status(500).json({error:"Failed To Get Student"});
        }
        if (results.length === 0) {
            return res.status(404).json({error:"Student Not Found"});
        }
        res.json(results[0]);
    });
});

// GET /students/:id/grades - Returns all grades for a specific student
app.get('/students/:id/grades', (req,res) =>{
    const { id } = req.params;
    const sql ='SELECT classes.class_name, grades.grade_value FROM grades JOIN classes ON grades.class_id = classes.id WHERE grades.student_id = ?';
    db.query(sql, [id], (error, results)=>{
        if(error){
            console.error("Error Getting Grades:", error);
            return res.status(500).json({error:"Failed To Get Grades"});
        }
        res.json(results);
    });
});

// GET /students/:id/attendance - Returns all attendance records for a specific student
app.get('/students/:id/attendance', (req,res) =>{
    const { id } = req.params;
    const sql ='SELECT classes.class_name, attendance.date, attendance.status FROM attendance JOIN classes ON attendance.class_id = classes.id WHERE attendance.student_id = ? ORDER BY attendance.date DESC';
    db.query(sql, [id], (error, results)=>{
        if(error){
            console.error("Error Getting Attendance:", error);
            return res.status(500).json({error:"Failed To Get Attendance"});
        }
        res.json(results);
    });
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
