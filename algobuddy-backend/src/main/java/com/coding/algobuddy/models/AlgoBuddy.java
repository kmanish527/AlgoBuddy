package com.coding.algobuddy.models;

public class AlgoBuddy {

    private String problem;
    private String operation;
    private String currentSolution;

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String content) {
        this.problem = content;
    }

    public String getCurrentSolution() {
        return currentSolution;
    }

    public void setCurrentSolution(String currentSolution) {
        this.currentSolution = currentSolution;
    }
}
