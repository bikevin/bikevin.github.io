<?php
/**
 * Created by PhpStorm.
 * User: Kevin
 * Date: 5/20/2016
 * Time: 12:39 PM
 */

try{
    
    //open connection to database
    $DBH = new PDO("sqlite:network.db");

    //fetch users
    $STH = $DBH-> query("SELECT * FROM users");
    while($row = $STH->fetch()){
        echo $row['id'] . "\t";
        echo $row['name'] . "\n";
    }

    echo "~~#";

    //fetch projects
    $STH = $DBH->query("SELECT * FROM projects");
    while($row = $STH->fetch()){
        echo $row['name'] . "\t";
        echo $row['id'] . "\t";
        echo $row['lead_id'] . "\n";
    }

    echo "~~#";

    //fetch collaborators
    $STH = $DBH->query("SELECT * FROM project_collaborators");
    while($row = $STH->fetch()){
        echo $row['project_id'] . "\t";
        echo $row['user_id'] . "\n";
    }
} catch (PDOException $e){
    echo $e->getMessage();
}

//close the connection to the database
$DBH = null;