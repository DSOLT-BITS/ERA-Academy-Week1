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

// POST /users - Creates a new user account
app.post('/users', (req,res) =>{
    const{first_name, last_name, email, password} = req.body;
    if(!first_name || !last_name || !email || !password){
        return res.status(400).json({error:"First Name, Last Name, Email & Password Are Required"});
    }
    if (password.length < 8){
        return res.status(400).json({error:"Password Must Be At Least 8 Charcters Long"});
    }
    const specialChar = /[!@#$%]/;
    if(!specialChar.test(password)){
        return res.status(400).json({error:"Password Must Include One Special Character: !@#$%"});
    }

    // Auto-Link to students table byt matching first and last name
    const findStudent = 'SELECT id FROM students WHERE first_name = ? AND last_name = ?';
    db.query(findStudent, [first_name, last_name], (err, students) =>{
        if (err) return res.status(500).json ({error:"Failed To Create User"});
        const student_id = students.length > 0 ? students[0].id : null;
        const sql = 'INSERT INTO users (first_name, last_name, email, password, student_id) VALUES (?,?,?,?,?)';
        db.query(sql,[first_name, last_name, email, password, student_id],(error, results) =>{
            if(error){
                //Same email used twice - the unique rile one the email colum blocked it
                if (error.code === "ER_DUP_ENTRY"){
                    return res.status(409).json({error:"That Email Is Already Registered"});
                }
                console.error("Error Creating User", error);
                return res.status(500).json ({error:"Failed To Create User"}); 
            }
            res.status(201).json({
                message: "User Created Successfully",
                userId: results.insertId,
                student_id: student_id
            });
        });
        
    });
});

// GET /users - Returns All Users Without Passwords
app.get('/users', (req,res) =>{
    const sql ='SELECT id, first_name, last_name, email FROM users';
    db.query(sql, (error, results)=>{
        if(error) return res.status(500).json({error:"Failed To Get Users"});
        res.json(results);
    });
});

// POST /login - Checks Email & Password Against Users Table
app.post('/login', (req,res) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({error:"Email & Password Are Required"});
    }
    if (password.length < 8) {
        return res.status(400).json({error:"Password Must Be At Least 8 Characters Long"});
    }
    const specialChar =/[!@#$%]/;
    if (!specialChar.test(password)) {
        return res.status(400).json({error:"Password Must Contain At Least One Special Character: !@#$%"});
    }
    const sql ='SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (error, results)=>{
        if(error){
            console.error("login Query Error:", error);
            return res.status(500).json({error:"Something Went Wrong"});
        }
        if (results.length === 0) {
            return res.status(404).json({error:"User Not Found"});
        }
        const user = results[0];
        if (user.password !== password) {
            return res.status(401).json({error:"Invalid Email or Password"});
        }
        // Login successful - Return The Name & Student ID For The Frontend
        res.status(200).json({
            message: "Login successful",
            first_name: user.first_name,
            last_name: user.last_name,
            student_id: user.student_id
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
