<?php
/**
 * Created by PhpStorm.
 * User: Kevin
 * Date: 5/17/2016
 * Time: 12:16 PM
 */
try{
    $DBH = new PDO("sqlite:Network.db");
    
    $STH = $DBH-> query("SELECT * FROM users");
    while($row = $STH->fetch()){
        echo $row['id'] . "\t";
        echo $row['name'] . "\n";
    }
    
    echo "~~#";
    
    $STH = $DBH->query("SELECT * FROM projects");
    while($row = $STH->fetch()){
        echo $row['name'] . "\t";
        echo $row['id'] . "\t";
        echo $row['lead_id'] . "\n";
    }

    echo "~~#";

    $STH = $DBH->query("SELECT * FROM project_collaborators");
    while($row = $STH->fetch()){
        echo $row['project_id'] . "\t";
        echo $row['user_id'] . "\n";
    }
    
    echo "~~#";
    
    $STH = $DBH->query("SELECT protocols.id, protocols.name, protocols.user_id FROM protocols");
    while($row = $STH->fetch()){
        echo $row['id'] . "\t";
        echo $row['name'] . "\t";
        echo $row['user_id'] . "\n";
    }
    
    echo "~~#";
    
    $STH = $DBH->query("SELECT projects_protocols.project_id, projects_protocols.protocol_id FROM projects_protocols");
    while ($row = $STH->fetch()){
        echo $row['project_id'] . "\t";
        echo $row['protocol_id'] . "\n";
    }
    
} catch(PDOException $e){
    echo $e->getMessage();
}
$DBH = null;
